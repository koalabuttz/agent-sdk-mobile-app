export type VisibleChat = { agentId: string; conversationId: string };
export function suppressChatNotification(active: boolean, chat: VisibleChat | null, data: Record<string, unknown> | undefined): boolean {
  return active && chat !== null && data?.agentId === chat.agentId && data?.conversationId === chat.conversationId;
}
