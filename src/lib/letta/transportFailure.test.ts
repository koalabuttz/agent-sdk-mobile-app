import { test, expect } from 'bun:test';
import { isSessionTransportFailure } from './transportFailure';
test('SDK socket closure is transient, not a persistent chat failure',()=>{
 expect(isSessionTransportFailure({type:'error',errorCode:'stream_closed'})).toBe(true);
 expect(isSessionTransportFailure({type:'result',errorCode:'stream_closed'})).toBe(true);
 expect(isSessionTransportFailure({type:'error',message:'The app-server connection closed unexpectedly; resume the conversation to continue.'})).toBe(true);
});
test('real tool/model errors remain visible',()=>{
 expect(isSessionTransportFailure({type:'error',errorCode:'llm_api_error',message:'Provider connection failed'})).toBe(false);
 expect(isSessionTransportFailure({type:'result',errorCode:'interrupted'})).toBe(false);
 expect(isSessionTransportFailure({type:'tool_result',errorCode:'stream_closed'})).toBe(false);
});
