import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fcmMessage } from './fcm.js';
const event={key:'event-1',kind:'approval',agentId:'agent',conversationId:'conv',title:'Anna needs approval',body:'Open Bloop to review the request.'};
test('FCM payload has a stable tag, channel and opaque navigation identifiers',()=>{
  const payload=fcmMessage('test-token',event);
  assert.equal(payload.android.notification.channel_id,'anna-activity');
  assert.equal(payload.android.notification.tag,fcmMessage('test-token',event).android.notification.tag);
  assert.equal(payload.data.conversationId,'conv');
  assert.equal(payload.android.ttl,'3600s');
  assert.equal(Object.values(payload.data).every(v=>typeof v==='string'),true);
});
test('FCM rejects missing tokens and unknown notification types',()=>{
  assert.throws(()=>fcmMessage('',event));
  assert.throws(()=>fcmMessage('token',{...event,kind:'other'}));
});
