import { approvalNotification } from './events.js';

// Raw app-server protocol v0.32.3, not SDK result messages.
export function protocolNotification(message, expectedScope) {
  const runtime = message?.runtime;
  if (!runtime || runtime.agent_id !== expectedScope.agent_id ||
      runtime.conversation_id !== expectedScope.conversation_id || message.subagent_id) return null;
  if (message.type === 'control_request' && message.request?.subtype === 'can_use_tool') {
    const event = approvalNotification(runtime.conversation_id, message.request_id);
    return event ? { ...event, agentId: runtime.agent_id,
      key: JSON.stringify(['approval', runtime.agent_id, runtime.conversation_id, message.request_id]) } : null;
  }
  if (message.type !== 'turn_finished' || message.stop_reason !== 'end_turn' || message.error ||
      typeof message.turn_id !== 'string' || !message.turn_id) return null;
  return {
    key: JSON.stringify(['completion', runtime.agent_id, runtime.conversation_id, message.turn_id]),
    kind: 'completion', agentId: runtime.agent_id, conversationId: runtime.conversation_id,
    title: 'Anna finished', body: 'Open Bloop to see the response.',
  };
}
