import { test } from 'node:test';
import assert from 'node:assert/strict';
import { protocolNotification } from './protocol-events.js';
const scope={agent_id:'agent',conversation_id:'conv'};
const done={type:'turn_finished',runtime:scope,turn_id:'turn-1',stop_reason:'end_turn'};
test('raw turn completion uses stable scoped turn identity without requiring run_id',()=>{
  const event=protocolNotification(done,scope);
  assert.equal(event.kind,'completion');
  assert.equal(event.key,protocolNotification({...done},scope).key);
  assert.notEqual(event.key,protocolNotification({...done,turn_id:'turn-2'},scope).key);
});
test('ignores other conversations, subagents, failures and nonterminal frames',()=>{
  for(const patch of [{runtime:{...scope,conversation_id:'other'}},{subagent_id:'child'},{error:'failed'},{stop_reason:'interrupted'},{stop_reason:'requires_approval'},{stop_reason:undefined},{turn_id:''},{type:'update_loop_status'}]) {
    assert.equal(protocolNotification({...done,...patch},scope),null);
  }
});
test('approval only includes identifiers and generic text',()=>{
  const event=protocolNotification({type:'control_request',runtime:scope,request_id:'req',request:{subtype:'can_use_tool',input:{command:'private secret'}}},scope);
  assert.equal(event.kind,'approval');
  assert.equal(JSON.stringify(event).includes('private secret'),false);
  assert.equal(protocolNotification({type:'control_request',runtime:scope,request_id:'req',request:{subtype:'other'}},scope),null);
});
