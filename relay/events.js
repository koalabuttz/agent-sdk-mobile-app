// Classify complete SDK events, never connection state or partial tool output.
// Unknown terminal outcomes deliberately do not generate a success alert.
export function completionNotification(event) {
  if (event?.type !== 'result' || event.success !== true || event.stopReason !== 'end_turn') return null;
  if (typeof event.conversationId !== 'string' || !event.conversationId) return null;
  if (!Array.isArray(event.runIds) || !event.runIds.length ||
      event.runIds.some(id => typeof id !== 'string' || !id)) return null;
  return {
    key: JSON.stringify(['completion', event.conversationId, event.runIds]),
    kind: 'completion',
    conversationId: event.conversationId,
    title: 'Anna finished',
    body: 'Open Bloop to see the response.',
  };
}

export function approvalNotification(conversationId, requestId) {
  if (typeof conversationId !== 'string' || !conversationId ||
      typeof requestId !== 'string' || !requestId) return null;
  return {
    key: JSON.stringify(['approval', conversationId, requestId]),
    kind: 'approval',
    conversationId,
    requestId,
    title: 'Anna needs approval',
    body: 'Open Bloop to review the request.',
  };
}
