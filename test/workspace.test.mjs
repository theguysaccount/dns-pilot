import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
await build({entryPoints:['hosted/workspace-core.ts'],outfile:'.private/test-workspace.mjs',platform:'node',format:'esm',bundle:true,packages:'external'});
const { WorkspaceEngine } = await import('../.private/test-workspace.mjs');
const a={type:'A',name:'@',address:'192.0.2.10',ttl:1800};
const txt={type:'TXT',name:'@',value:'v=spf1 -all',ttl:1800};
const add={type:'TXT',name:'verify',value:'exact=Ab C',ttl:1800};
class Storage {
  map=new Map();
  async get(key){return structuredClone(this.map.get(key));}
  async put(key,value){if(typeof key==='object')for(const [k,v]of Object.entries(key))this.map.set(k,structuredClone(v));else this.map.set(key,structuredClone(value));}
  async delete(key){return this.map.delete(key);}
  async list({prefix='',limit=Infinity}={}){return new Map([...this.map].filter(([k])=>k.startsWith(prefix)).slice(0,limit));}
  async setAlarm(value){this.alarm=value;}
}
const key=r=>JSON.stringify(Object.fromEntries(Object.entries(r).filter(([k])=>!['ttl','group'].includes(k)).sort()));
function setup(writes='true'){
  const storage=new Storage();
  const state={items:[a,txt],writes:[],fail:false,drift:false};
  const provider={async connect(){},async close(){},async domains(){return{items:[{name:'example.com'}],total:1};},async snapshot(domain){return{domain,capturedAt:new Date().toISOString(),nameservers:{provider:'basic',hosts:['dns1.registrar-servers.com','dns2.registrar-servers.com']},items:structuredClone(state.items),total:state.items.length,omittedRecords:[]};},async call(tool,args){state.writes.push(tool);if(tool==='dns_records_save')state.items=[...state.items.filter(r=>!args.records.some(x=>key(x)===key(r))),...args.records];else state.items=state.items.filter(r=>!args.records.some(x=>key(x)===key(r)));if(state.fail)throw new Error('Lost response after provider changed records');}};
  const engine=new WorkspaceEngine({storage},{WRITES_ENABLED:writes},()=>provider);
  const call=async(action,args,subject='account-1')=>{const r=await engine.fetch(new Request('https://internal/action',{method:'POST',body:JSON.stringify({subject,token:'fixture-only',action,args})}));return{status:r.status,...await r.json()};};
  return{storage,state,engine,call,plan:()=>call('plan',{domain:'example.com',operations:[{action:'add',record:add}]})};
}
test('hosted apply preserves mail, verifies all records, and duplicate apply does not write again',async()=>{
  const x=setup(),p=await x.plan(),r=await x.call('apply',{planId:p.planId});
  assert.equal(r.status,'provider_state_verified');assert.deepEqual(x.state.items,[a,txt,add]);assert.equal(x.state.writes.length,1);
  assert.equal((await x.call('apply',{planId:p.planId})).status,'provider_state_verified');assert.equal(x.state.writes.length,1);
});
test('unknown write outcomes lock the domain and cannot replay; reconciliation is read-only',async()=>{
  const x=setup(),p=await x.plan();x.state.fail=true;
  assert.equal((await x.call('apply',{planId:p.planId})).status,'needs_attention');assert.equal(x.state.writes.length,1);
  assert.match((await x.call('apply',{planId:p.planId})).error,/cannot be retried/);
  assert.match((await x.plan()).error,/uncertain result/);
  assert.equal((await x.call('reconcile',{planId:p.planId})).status,'provider_state_verified');assert.equal(x.state.writes.length,1);
  assert.ok((await x.plan()).planId);assert.equal(await x.storage.get('lock:example.com'),undefined);
});
test('two concurrent applies serialize and issue one provider write',async()=>{
  const x=setup(),p=await x.plan();const results=await Promise.all([x.call('apply',{planId:p.planId}),x.call('apply',{planId:p.planId})]);
  assert.ok(results.every(r=>r.status==='provider_state_verified'));assert.equal(x.state.writes.length,1);
});
test('account isolation rejects cross-account calls and plans never resolve in another workspace',async()=>{
  const x=setup(),p=await x.plan(),y=setup();
  assert.match((await x.call('apply',{planId:p.planId},'account-2')).error,/isolation/);
  assert.match((await y.call('apply',{planId:p.planId},'account-2')).error,/not found/);assert.equal(x.state.writes.length,0);
});
test('stale provider state prevents any write and requires reconciliation',async()=>{
  const x=setup(),p=await x.plan();x.state.items=[a,{...txt,value:'v=spf1 include:mail.example.com -all'}];
  assert.equal((await x.call('apply',{planId:p.planId})).status,'needs_attention');assert.equal(x.state.writes.length,0);
});
test('beta write switch fails closed',async()=>{
  const x=setup('false'),p=await x.plan();assert.match((await x.call('apply',{planId:p.planId})).error,/not enabled/);assert.equal(x.state.writes.length,0);
});
test('expiry cleanup cannot remove another plan’s domain lock',async()=>{
  const x=setup();await x.storage.put('plan:old',{id:'old',domain:'example.com',status:'needs_attention',expiresAt:0,createdAt:Date.now()-86401_000});await x.storage.put('lock:example.com','new');
  await x.engine.alarm();assert.equal(await x.storage.get('plan:old'),undefined);assert.equal(await x.storage.get('lock:example.com'),'new');
});
test('account rate limiting applies across calls',async()=>{
  const x=setup();for(let i=0;i<20;i++)assert.equal((await x.call('domains',{})).total,1);
  assert.match((await x.call('domains',{})).error,/request limit/);
});
