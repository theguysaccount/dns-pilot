import { Resolver } from 'node:dns/promises';
import { domainToASCII } from 'node:url';
const types = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'CAA', 'SRV', 'SOA'];

export async function lookupDNS(name, type, resolverFactory = () => new Resolver({ timeout: 2500, tries: 1 })) {
  const clean = domainToASCII(name.trim().replace(/\.$/, '')).toLowerCase();
  if (!clean || clean.length > 253 || !clean.includes('.') || clean.split('.').some(l => !/^[a-z0-9_](?:[a-z0-9_-]*[a-z0-9_])?$/.test(l) || l.length > 63) || !types.includes(type)) throw new Error('Provide a valid DNS hostname and supported record type.');
  const observations = await Promise.all([['Cloudflare', '1.1.1.1'], ['Google', '8.8.8.8']].map(async ([provider, address]) => {
    const resolver = resolverFactory(); resolver.setServers([address]);
    try { return { resolver: provider, server: address, status: 'answer', records: await resolver.resolve(clean, type) }; }
    catch (e) { return { resolver: provider, server: address, status: ['ENODATA', 'ENOTFOUND'].includes(e.code) ? 'no_answer' : 'error', code: e.code ?? 'DNS_ERROR' }; }
  }));
  return { name: clean, type, checkedAt: new Date().toISOString(), observations, note: 'Recursive resolver observations only; they do not prove global propagation, authoritative DNS, HTTPS readiness, or mail delivery. Queries are sent to Cloudflare and Google.' };
}
