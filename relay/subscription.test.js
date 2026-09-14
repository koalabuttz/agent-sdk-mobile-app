import { test } from 'node:test';
import assert from 'node:assert/strict';
import { observerSubscription } from './subscription.js';

test('observer requests scoped state without applying runtime settings or recovery', () => {
  assert.deepEqual(observerSubscription('agent-test', 'conv-test', 'sync-test'), {
    type: 'sync', request_id: 'sync-test',
    runtime: { agent_id: 'agent-test', conversation_id: 'conv-test' },
    recover_approvals: false, force_device_status: true,
  });
});
test('observer refuses implicit or missing scopes', () => {
  for (const value of [null, undefined, '', ' ']) {
    assert.throws(() => observerSubscription(value, 'conv', 'req'));
    assert.throws(() => observerSubscription('agent', value, 'req'));
    assert.throws(() => observerSubscription('agent', 'conv', value));
  }
});
