import assert from 'node:assert/strict';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
const origin=process.env.PUBLIC_ORIGIN||'https://dns-pilot.cuelayer.workers.dev';
const hashes=new Set();
for(const path of ['','privacy','terms','support']){
 const response=await fetch(`${origin}/${path}`);assert.equal(response.status,200);const html=await response.text();
 assert.match(html,/Jackson Alan Jesionowski/);assert.match(html,/Namecheap is a third-party integration/);
 assert.match(html,/<html lang="en">/);assert.equal((html.match(/<h1>/g)||[]).length,1);assert.match(html,/<meta name="description" content="[^"]+">/);
 assert.ok(html.includes(`<link rel="canonical" href="${origin}/${path}">`));
 const image=html.match(/property="og:image" content="([^"]+)"/)?.[1];assert.equal(image,`${origin}/share/${path||'home'}.png`);assert.ok(html.includes(`name="twitter:image" content="${image}"`));
 const result=await fetch(image);assert.equal(result.status,200);assert.match(result.headers.get('content-type'),/image\/png/);const bytes=Buffer.from(await result.arrayBuffer());const meta=await sharp(bytes).metadata();assert.equal(meta.width,1200);assert.equal(meta.height,630);
 const hash=createHash('sha256').update(bytes).digest('hex');assert.ok(!hashes.has(hash),'Each page needs a distinct share image');hashes.add(hash);
 console.log(`PASS /${path} — canonical, description, OG, Twitter, unique 1200×630 public image`);
}
for(const path of ['robots.txt','sitemap.xml','style.css','icon.png'])assert.equal((await fetch(`${origin}/${path}`)).status,200);
const health=await(await fetch(origin+'/health')).json();assert.equal(health.writesEnabled,false);assert.equal(health.connectionReady,false);
assert.equal(health.reviewerSandboxReady,true);
assert.equal((await fetch(origin+'/authorize')).status,400);
const review=await fetch(origin+'/review');assert.equal(review.status,200);assert.match(review.headers.get('x-robots-tag'),/noindex/);assert.match(await review.text(),/synthetic and isolated/);
const unauth=await fetch(origin+'/mcp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',method:'initialize',id:1})});assert.equal(unauth.status,401);assert.ok(unauth.headers.get('www-authenticate')?.includes('oauth-protected-resource'));
const fake=await fetch(origin+'/mcp',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer forged'},body:'{}'});assert.equal(fake.status,401);
const meta=await(await fetch(origin+'/.well-known/oauth-protected-resource/mcp')).json();assert.equal(meta.resource,origin+'/mcp');assert.deepEqual(meta.authorization_servers,[origin]);
const issuer=await(await fetch(origin+'/.well-known/oauth-authorization-server')).json();assert.equal(issuer.issuer,origin);assert.ok(issuer.code_challenge_methods_supported.includes('S256'));
assert.equal((await fetch(origin+'/authorize',{method:'POST',headers:{Origin:'https://attacker.invalid'},body:'decision=approve'})).status,403);
assert.equal((await fetch(origin+'/callback?state=forged&code=forged')).status,400);
console.log('PASS hosted health, authentication boundary, OAuth metadata, forged-token rejection, consent origin, and callback state');
