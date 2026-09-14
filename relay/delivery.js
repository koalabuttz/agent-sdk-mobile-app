import { createHash } from 'node:crypto';

export async function deliverOne({ outbox, sender, observer, token, now = Date.now() }) {
  if (!token) return 'no-device';
  const fingerprint = createHash('sha256').update(token).digest('hex');
  if (outbox.deviceChanged(fingerprint, now)) return 'device-reset';
  outbox.expireBefore(now - 5 * 60 * 1000);
  if (now < Number(outbox.getMeta('next-send') || 0)) return 'rate-limited';
  for (const row of outbox.pending(now)) {
    if (row.notification.kind === 'approval') {
      const pending = observer.approvalPending(row.notification, now);
      if (pending === false) { outbox.retire(row.key, now); continue; }
      if (pending !== true) continue; // Unknown/stale state is not permission to send.
    }
    // Persist before network IO: a crash/restart must not create a rapid burst.
    outbox.setMeta('next-send', now + 30000);
    try {
      const result = await sender.send(token, row.notification);
      if (result.accepted) { outbox.delivered(row.key, now); return 'accepted'; }
      outbox.retry(row.key, now);
      return result.unregister ? 'expired-token' : 'retry';
    } catch { outbox.retry(row.key, now); return 'retry'; }
  }
  return 'idle';
}
