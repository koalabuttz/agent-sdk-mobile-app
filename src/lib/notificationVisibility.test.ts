import { test, expect } from 'bun:test';
import { suppressChatNotification } from './notificationVisibility';
test('only the active matching chat suppresses an alert',()=>{
 const chat={agentId:'anna',conversationId:'one'};
 expect(suppressChatNotification(true,chat,chat)).toBe(true);
 expect(suppressChatNotification(false,chat,chat)).toBe(false);
 expect(suppressChatNotification(true,null,chat)).toBe(false);
 expect(suppressChatNotification(true,chat,{...chat,conversationId:'two'})).toBe(false);
 expect(suppressChatNotification(true,chat,{...chat,agentId:'other'})).toBe(false);
 expect(suppressChatNotification(true,chat,undefined)).toBe(false);
});
