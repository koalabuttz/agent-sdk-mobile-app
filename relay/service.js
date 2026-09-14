import { readFileSync } from 'node:fs';
import { Outbox } from './outbox.js';
import { Observer } from './observer.js';
import { FcmSender } from './fcm.js';
import { deliverOne } from './delivery.js';

const config = JSON.parse(readFileSync('/etc/anna-relay/config.json','utf8'));
const outbox = new Outbox('/var/lib/anna-relay/outbox.sqlite');
const sender = new FcmSender({projectId:config.firebaseProject,keyFilename:'/etc/anna-relay/firebase-key.json'});
let connected=false, stopping=false, busy=false;
const observer = new Observer({url:config.lettaUrl,agentId:config.agentId,
 token:readFileSync('/etc/anna-relay/letta-token','utf8').trim(),
 onHealth:healthy=>{if(healthy!==connected)console.log(healthy?'Observer connected':'Observer disconnected');connected=healthy;},
 onEvent:event=>{if(outbox.enqueue(event)) console.log(`Queued ${event.kind} notification`);},
});
async function deliver(){
 if(busy||stopping)return;
 busy=true;
 try{
  let token;try{token=readFileSync('/etc/anna-relay/phone-token','utf8').trim();}catch{return;}
  const result=await deliverOne({outbox,sender,observer,token});
  if(!['idle','rate-limited','no-device'].includes(result))console.log(`Delivery: ${result}`);
 }catch{console.error('Delivery worker error; details suppressed');}
 finally{busy=false;}
}
// Establish token baseline before subscribing to new activity.
await deliver();
observer.start();
const interval=setInterval(()=>void deliver(),3000);
process.on('SIGTERM',()=>{stopping=true;clearInterval(interval);observer.close();setTimeout(()=>process.exit(0),20000).unref();});
