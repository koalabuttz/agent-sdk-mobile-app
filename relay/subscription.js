// Verified against Letta Code v0.32.3 message-router.ts and lifecycle.ts.
// sync subscribes without runtime_start's skill/workspace configuration changes.
export function observerSubscription(agentId, conversationId, requestId) {
  for (const value of [agentId, conversationId, requestId]) {
    if (typeof value !== 'string' || !value.trim()) throw new Error('Explicit scope and request ID required');
  }
  return {
    type: 'sync',
    request_id: requestId,
    runtime: { agent_id: agentId, conversation_id: conversationId },
    recover_approvals: false,
    force_device_status: true,
  };
}
