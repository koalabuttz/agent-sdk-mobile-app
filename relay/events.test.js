import { test } from 'node:test';
import assert from 'node:assert/strict';
import { completionNotification, approvalNotification } from './events.js';

const completed = { type: 'result', success: true, stopReason: 'end_turn', conversationId: 'conv-test', runIds: ['run-test'], result: 'private chat text' };
test('completion alert contains no chat content', () => {
  const notification = completionNotification(completed);
  assert.equal(notification.kind, 'completion');
  assert.equal(JSON.stringify(notification).includes(completed.result), false);
});
test('disconnect, interruption, and uncertain outcomes are not completion', () => {
  for (const stopReason of ['stream_closed', 'interrupted', 'requires_approval', undefined]) {
    assert.equal(completionNotification({ ...completed, stopReason }), null);
  }
  assert.equal(completionNotification({ ...completed, success: false }), null);
  assert.equal(completionNotification({ ...completed, runIds: [] }), null);
  assert.equal(completionNotification({ type: 'assistant', content: 'done' }), null);
});
test('stable keys support replay deduplication and distinguish turns', () => {
  assert.equal(completionNotification(completed).key, completionNotification({ ...completed }).key);
  assert.notEqual(completionNotification(completed).key, completionNotification({ ...completed, runIds: ['run-next'] }).key);
});
test('approval alerts need both scoped identifiers and do not include tool arguments', () => {
  assert.equal(approvalNotification('', 'req'), null);
  assert.equal(approvalNotification('conv', undefined), null);
  assert.equal(approvalNotification('conv', 'req').kind, 'approval');
  assert.notEqual(approvalNotification('conv', 'req').key, approvalNotification('other', 'req').key);
});
