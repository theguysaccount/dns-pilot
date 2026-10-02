import test from 'node:test';
import assert from 'node:assert/strict';
import {validateRegistration} from '../scripts/register-namecheap.mjs';
test('a returned client ID without the requested callback is not a successful registration',()=>{
 const callback='https://dns-pilot.example/callback';
 assert.throws(()=>validateRegistration({client_id:'shared-client',redirect_uris:['https://claude.ai/api/mcp/auth_callback']},callback),/did not approve/);
 assert.equal(validateRegistration({client_id:'dedicated-client',redirect_uris:[callback]},callback).clientId,'dedicated-client');
});
