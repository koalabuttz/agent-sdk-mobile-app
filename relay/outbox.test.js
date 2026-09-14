import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Outbox } from './outbox.js';

test('queue survives restart and deduplicates delivered events', () => {
  const dir = mkdtempSync(join(tmpdir(), 'anna-outbox-'));
  let box;
  try {
    const path = join(dir, 'outbox.sqlite');
    box = new Outbox(path);
    assert.equal(box.enqueue({ key: 'a', kind: 'approval' }, 100), true);
    assert.equal(box.enqueue({ key: 'a', kind: 'approval' }, 100), false);
    box.close(); box = new Outbox(path);
    assert.equal(box.pending(100).length, 1);
    box.delivered('a', 200);
    box.close(); box = new Outbox(path);
    assert.equal(box.pending(300).length, 0);
    assert.equal(box.enqueue({ key: 'a' }, 300), false);
  } finally { box?.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('failures back off without dropping pending alerts', () => {
  const box = new Outbox(':memory:');
  try {
    box.enqueue({ key: 'a' }, 0);
    box.retry('a', 0);
    assert.equal(box.pending(999).length, 0);
    assert.equal(box.pending(1000)[0].attempts, 1);
    box.retry('a', 1000);
    assert.equal(box.pending(2999).length, 0);
    assert.equal(box.pending(3000)[0].attempts, 2);
  } finally { box.close(); }
});
