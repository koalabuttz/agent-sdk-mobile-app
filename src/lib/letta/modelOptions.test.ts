import { test, expect } from 'bun:test';
import { uniqueModelOptions } from './modelOptions';
test('deduplicates handles without merging distinct BYOK providers',()=>{
 const models=[{handle:'deepseek/a',label:'DeepSeek'},{handle:'deepseek/a',label:'DeepSeek'},{handle:'custom/a',label:'DeepSeek'},...Array.from({length:12},(_,i)=>({handle:`provider/${i}`,label:`Model ${i}`}))];
 const result=uniqueModelOptions(models);
 expect(result.length).toBe(14);
 expect(result.filter(m=>m.label==='DeepSeek').length).toBe(2);
 expect(result.at(-1)?.handle).toBe('provider/11');
});
