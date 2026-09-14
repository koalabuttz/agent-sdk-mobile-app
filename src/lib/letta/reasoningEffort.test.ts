import { test, expect } from 'bun:test';
import { readReasoningEffort } from './reasoningEffort';
test('reads confirmed nested and provider-specific effort fields',()=>{
 expect(readReasoningEffort({reasoning:{reasoning_effort:'high'}})).toBe('high');
 expect(readReasoningEffort({reasoning_effort:'none'})).toBe('none');
 expect(readReasoningEffort({effort:'low'})).toBe('low');
 expect(readReasoningEffort({thinking:{type:'adaptive'}})).toBe('thinking');
 expect(readReasoningEffort(null)).toBe(null);
 expect(readReasoningEffort({})).toBe(null);
});
