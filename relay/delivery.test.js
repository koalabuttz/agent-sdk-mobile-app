import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Outbox } from './outbox.js';
import { deliverOne } from './delivery.js';

test('first token drops a large historical backlog and retains dedupe tombstones',async()=>{
 const outbox=new Outbox(':memory:');let sent=0;
 try{
  for(let i=0;i<100;i++)outbox.enqueue({key:String(i),kind:'completion'},100);
  const args={outbox,token:'new',sender:{send:async()=>{sent++;return {accepted:true};}},observer:{approvalPending:()=>true},now:200};
  assert.equal(await deliverOne(args),'device-reset');
  assert.equal(outbox.pending(200).length,0);assert.equal(sent,0);
  assert.equal(outbox.enqueue({key:'1',kind:'completion'},200),false);
  outbox.enqueue({key:'fresh',kind:'completion'},200);
  assert.equal(await deliverOne(args),'accepted');assert.equal(sent,1);
  outbox.enqueue({key:'another',kind:'completion'},200);
  assert.equal(await deliverOne(args),'rate-limited');assert.equal(sent,1);
  assert.equal(await deliverOne({...args,token:'rotated',now:400}),'device-reset');
  assert.equal(outbox.pending(400).length,0);
 }finally{outbox.close();}
});
test('resolved approvals are retired and unknown approval state waits',async()=>{
 const outbox=new Outbox(':memory:');let sent=0;
 const args={outbox,token:'token',sender:{send:async()=>{sent++;return {accepted:true};}},observer:{approvalPending:()=>false},now:100};
 try{
  await deliverOne(args);
  outbox.enqueue({key:'resolved',kind:'approval'},100);
  assert.equal(await deliverOne(args),'idle');assert.equal(sent,0);
  assert.equal(outbox.pending(100).length,0);
  outbox.enqueue({key:'unknown',kind:'approval'},100);
  assert.equal(await deliverOne({...args,observer:{approvalPending:()=>null}}),'idle');
  assert.equal(sent,0);assert.equal(outbox.pending(100).length,1);
 }finally{outbox.close();}
});
test('five-minute expiry prevents old alerts from trickling out',async()=>{
 const outbox=new Outbox(':memory:');
 try{
  outbox.deviceChanged('baseline',0);
  outbox.enqueue({key:'old',kind:'completion'},0);
  outbox.expireBefore(1);
  assert.equal(outbox.pending(10).length,0);
  assert.equal(outbox.enqueue({key:'old'},10),false);
 }finally{outbox.close();}
});
