import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
await build({entryPoints:['hosted/demo-provider.ts','hosted/review.ts','hosted/workspace-core.ts'],outdir:'.private/review-test',outExtension:{'.js':'.mjs'},platform:'node',format:'esm',bundle:true,packages:'external'});
const {DemoProvider}=await import('../.private/review-test/demo-provider.mjs');
const {WorkspaceEngine}=await import('../.private/review-test/workspace-core.mjs');
const {reviewCredentials,reviewRoute}=await import('../.private/review-test/review.mjs');
class Store { map=new Map(); async get(k){return structuredClone(this.map.get(k));} async put(k,v){if(typeof k==='object')for(const [key,val]of Object.entries(k))this.map.set(key,structuredClone(val));else this.map.set(k,structuredClone(v));} async delete(k){this.map.delete(k);} async list({prefix='',limit=Infinity}){return new Map([...this.map].filter(([k])=>k.startsWith(prefix)).slice(0,limit));} async setAlarm(){} }
test('review sandbox exercises real planner and preserves mail without network writes',async()=>{
const storage=new Store(),provider=new DemoProvider(storage),engine=new WorkspaceEngine({storage},{WRITES_ENABLED:'true'},()=>provider);
const call=async(action,args)=>{const r=await engine.fetch(new Request('https://internal/action',{method:'POST',body:JSON.stringify({subject:'demo:00000000-0000-4000-8000-000000000001',mode:'sandbox',token:'sample',action,args})}));return r.json();};
const initial=await provider.snapshot('example.com');assert.equal(initial.items.length,5);
const p=await call('plan',{domain:'example.com',operations:[{action:'add',record:{type:'TXT',name:'_review',value:'dns-pilot-review=Ab C',ttl:1800}}]});assert.ok(p.planId);
assert.equal((await provider.snapshot('example.com')).items.length,5);
assert.equal((await call('apply',{planId:p.planId})).status,'provider_state_verified');
const after=await provider.snapshot('example.com');assert.equal(after.items.length,6);for(const r of initial.items)assert.ok(after.items.some(x=>JSON.stringify(x)===JSON.stringify(r)));
assert.equal((await call('reconcile',{planId:p.planId})).status,'provider_state_verified');
await assert.rejects(()=>provider.snapshot('unowned-example.org'),/only the simulated/);
await assert.rejects(()=>provider.call('dns_records_save',{domainName:'unowned-example.org',records:[]}),/restricted/);
assert.equal((await new DemoProvider(new Store()).snapshot('example.com')).items.length,5);
});
test('review credentials fail closed and private review API rejects missing sessions and cross-origin requests',async()=>{
const env={PUBLIC_ORIGIN:'https://dns-pilot.example',OAUTH_KV:{get:async()=>null}};
assert.equal(await reviewCredentials(env,'dns-pilot-review','anything'),false);
const password='fixture-password-not-for-production';const hash=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(password))).toString('hex');
assert.equal(await reviewCredentials({...env,REVIEW_PASSWORD_SHA256:hash},'dns-pilot-review',password),true);
assert.equal(await reviewCredentials({...env,REVIEW_PASSWORD_SHA256:hash},'other',password),false);
assert.equal(await reviewCredentials({...env,REVIEW_PASSWORD_SHA256:hash},'dns-pilot-review','wrong'),false);
let called=false;const api={fetch:()=>{called=true;}};
assert.equal((await reviewRoute(new Request(env.PUBLIC_ORIGIN+'/review/action',{method:'POST',headers:{Origin:env.PUBLIC_ORIGIN}}),env,{},api)).status,401);
assert.equal((await reviewRoute(new Request(env.PUBLIC_ORIGIN+'/review/action',{method:'POST',headers:{Origin:'https://attacker.example'}}),env,{},api)).status,403);assert.equal(called,false);
});
