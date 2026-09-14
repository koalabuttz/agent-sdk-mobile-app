import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Observer } from './observer.js';
test('observer emits scoped events and sends no mutations or approval decisions',()=>{
 const commands=[],events=[];
 const observer=new Observer({url:'ws://unused',token:'test',agentId:'agent',onEvent:e=>events.push(e)});
 observer.send=c=>commands.push(c);
 observer.discover();
 observer.receive({type:'conversation_list_response',request_id:'relay-list',success:true,conversations:[{id:'conv',agent_id:'agent'},{id:'foreign',agent_id:'other'}]});
 observer.receive({type:'control_request',runtime:{agent_id:'agent',conversation_id:'conv'},request_id:'req',request:{subtype:'can_use_tool'}});
 observer.receive({type:'turn_finished',runtime:{agent_id:'other',conversation_id:'conv'},turn_id:'turn',stop_reason:'end_turn'});
 assert.equal(events.length,1);
 assert.deepEqual(commands.map(c=>c.type),['conversation_list','sync']);
 assert.equal(commands[1].recover_approvals,false);
});
