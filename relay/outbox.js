import { DatabaseSync } from 'node:sqlite';

// One relay process owns this database. Record events before attempting push.
export class Outbox {
  constructor(path) {
    this.db = new DatabaseSync(path);
    this.db.exec(`PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS notifications (
        key TEXT PRIMARY KEY, payload TEXT NOT NULL,
        created_at INTEGER NOT NULL, delivered_at INTEGER,
        attempts INTEGER NOT NULL DEFAULT 0, next_attempt_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS relay_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);`);
    const columns = this.db.prepare('PRAGMA table_info(notifications)').all();
    if (!columns.some(c => c.name === 'retired_at')) this.db.exec('ALTER TABLE notifications ADD COLUMN retired_at INTEGER');
  }
  enqueue(notification, now = Date.now()) {
    if (!notification || typeof notification.key !== 'string' || !notification.key) throw new Error('Notification requires a stable key');
    return this.db.prepare('INSERT OR IGNORE INTO notifications(key,payload,created_at,next_attempt_at) VALUES(?,?,?,?)')
      .run(notification.key, JSON.stringify(notification), now, now).changes === 1;
  }
  pending(now = Date.now(), limit = 50) {
    return this.db.prepare('SELECT key,payload,attempts FROM notifications WHERE delivered_at IS NULL AND retired_at IS NULL AND next_attempt_at <= ? ORDER BY created_at LIMIT ?')
      .all(now, limit).map(row => ({ key: row.key, notification: JSON.parse(row.payload), attempts: row.attempts }));
  }
  delivered(key, now = Date.now()) {
    this.db.prepare('UPDATE notifications SET delivered_at=? WHERE key=? AND delivered_at IS NULL').run(now, key);
  }
  retry(key, now = Date.now()) {
    const row = this.db.prepare('SELECT attempts FROM notifications WHERE key=? AND delivered_at IS NULL').get(key);
    if (!row) return;
    const delay = Math.min(3600000, 1000 * 2 ** Math.min(row.attempts, 12));
    this.db.prepare('UPDATE notifications SET attempts=attempts+1,next_attempt_at=? WHERE key=?').run(now + delay, key);
  }
  expireBefore(cutoff) {
    this.db.prepare('UPDATE notifications SET retired_at=? WHERE delivered_at IS NULL AND retired_at IS NULL AND created_at < ?').run(Date.now(), cutoff);
  }
  retire(key, now = Date.now()) {
    this.db.prepare('UPDATE notifications SET retired_at=? WHERE key=? AND delivered_at IS NULL').run(now, key);
  }
  getMeta(key) { return this.db.prepare('SELECT value FROM relay_meta WHERE key=?').get(key)?.value; }
  setMeta(key, value) { this.db.prepare('INSERT OR REPLACE INTO relay_meta(key,value) VALUES(?,?)').run(key, String(value)); }
  deviceChanged(fingerprint, now = Date.now()) {
    if (this.getMeta('device') === fingerprint) return false;
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare('UPDATE notifications SET retired_at=? WHERE delivered_at IS NULL AND retired_at IS NULL').run(now);
      this.setMeta('device', fingerprint);
      this.db.exec('COMMIT');
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
    return true;
  }
  close() { this.db.close(); }
}
