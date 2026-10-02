// The provider can return a fixed client ID and omit requested callback URLs.
// A 200 response is not sufficient evidence of a usable registration.
export function validateRegistration(data, redirectUri) {
  if (!data || typeof data.client_id !== 'string' || !data.client_id) throw new Error('Namecheap did not return a client ID.');
  if (!Array.isArray(data.redirect_uris) || !data.redirect_uris.includes(redirectUri)) throw new Error('Namecheap did not approve this exact callback URL. Obtain provider approval; do not deploy this client as connected.');
  return { clientId: data.client_id, redirectUri, needsSecret: Boolean(data.client_secret) };
}
if (process.argv[1]?.endsWith('/register-namecheap.mjs')) {
  const origin=process.env.PUBLIC_ORIGIN;
  if (!origin || new URL(origin).protocol!=='https:') throw new Error('Set PUBLIC_ORIGIN to your controlled HTTPS origin.');
  const redirectUri=origin+'/callback';
  const result=await fetch('https://mcp.namecheap.com/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({client_name:'DNS Pilot for Namecheap',client_uri:origin,redirect_uris:[redirectUri],grant_types:['authorization_code','refresh_token'],response_types:['code'],token_endpoint_auth_method:'none'})});
  if(!result.ok)throw new Error('Namecheap client registration failed.');
  const metadata=await result.json();console.log(validateRegistration(metadata,redirectUri));
}
