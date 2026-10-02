import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { domainToASCII } from 'node:url';
import { getDomain } from 'tldts';
import { z } from 'zod';

const host = z.string().min(1).max(253);
const word = z.string().min(1).max(4096);
const uint16 = z.number().int().min(0).max(65535);
const base = { name: host, ttl: z.number().int().min(60).max(3600).optional() };
const shape = (type, fields) => z.object({ ...base, type: z.literal(type), ...fields }).strict();
export const recordSchema = z.discriminatedUnion('type', [
  shape('A', { address: word }), shape('AAAA', { address: word }),
  shape('CNAME', { cname: host }), shape('ALIAS', { aliasName: host }),
  shape('NS', { nameserver: host }), shape('PTR', { pointer: host }),
  shape('TXT', { value: z.string().max(4096) }),
  shape('MX', { exchange: host, preference: uint16 }),
  shape('CAA', { flag: z.union([z.literal(0), z.literal(128)]), tag: z.enum(['issue', 'issuewild', 'iodef']), value: word }),
  shape('SRV', { service: host, protocol: host, priority: uint16, weight: uint16, port: uint16.min(1), target: host }),
  shape('TLSA', { usage: uint16.max(255), selector: uint16.max(255), matching: uint16.max(255), port: host, protocol: host, associationData: word }),
  shape('HTTPS', { svcPriority: uint16, targetName: host, port: host.optional(), scheme: host.optional(), svcParams: z.string().max(4096).optional() }),
  shape('SVCB', { svcPriority: uint16, targetName: host, port: host.optional(), scheme: host.optional(), svcParams: z.string().max(4096).optional() }),
]);
export const operationSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('add'), record: recordSchema }).strict(),
  z.object({ action: z.literal('remove'), record: recordSchema }).strict(),
  z.object({ action: z.literal('replace'), before: recordSchema, after: recordSchema }).strict(),
]);
export const snapshotSchema = z.object({
  domain: z.string(), capturedAt: z.string().datetime(),
  nameservers: z.object({ provider: z.enum(['basic', 'custom']), hosts: z.array(z.string()).min(1) }).strict(),
  items: z.array(z.record(z.string(), z.unknown())).max(5000),
  total: z.number().int().min(0).max(5000),
  omittedRecords: z.array(z.object({ type: z.string(), name: z.string() }).strict()).max(5000).default([]),
}).strict();

export function domainName(input) {
  const ascii = domainToASCII(input.trim().replace(/\.$/, '')).toLowerCase();
  if (!ascii || !/^[a-z0-9.-]+$/.test(ascii) || ascii.length > 253 || getDomain(ascii, { allowPrivateDomains: false }) !== ascii || ascii.split('.').some(l => !l || l.length > 63 || l.startsWith('-') || l.endsWith('-'))) {
    throw new Error('Use the exact registered domain, such as example.com or example.co.uk, without a URL or subdomain.');
  }
  return ascii;
}

function targetName(input, allowDot = false) {
  if (allowDot && input === '.') return '.';
  const result = domainToASCII(input.replace(/\.$/, '')).toLowerCase();
  if (!result || result.length > 253 || !result.includes('.') || result.split('.').some(l => !/^[a-z0-9_](?:[a-z0-9_-]*[a-z0-9_])?$/.test(l) || l.length > 63)) throw new Error('Record targets must be valid fully qualified hostnames.');
  return result;
}

export function normalizeRecord(raw, domain, { reading = false } = {}) {
  const { group, ...fields } = raw;
  // Old provider TTLs can exceed the MCP write range. Read them intact; refuse
  // to use them in a write without an explicit supported TTL.
  const readTTL = reading ? fields.ttl : undefined;
  if (reading) delete fields.ttl;
  const r = recordSchema.parse(fields);
  if (reading && readTTL !== undefined) r.ttl = z.number().int().nonnegative().parse(readTTL);
  if (group !== undefined && !['custom', 'product', 'personalNs'].includes(group)) throw new Error('Unknown record ownership group.');
  r.name = r.name.toLowerCase().replace(/\.$/, '');
  if (r.name === domain) r.name = '@';
  else if (r.name.endsWith('.' + domain)) r.name = r.name.slice(0, -domain.length - 1);
  if (r.name !== '@' && r.name.split('.').some((l, i) => !(l === '*' && i === 0) && (!/^[a-z0-9_](?:[a-z0-9_-]*[a-z0-9_])?$/.test(l) || l.length > 63))) throw new Error('Invalid record name. Use a relative hostname, @, or a wildcard.');
  if (r.name !== '@' && r.name.length + domain.length + 1 > 253) throw new Error('Record hostname is too long.');
  if (r.type === 'A' && isIP(r.address) !== 4) throw new Error('A records require a valid IPv4 address.');
  if (r.type === 'AAAA') {
    if (isIP(r.address) !== 6) throw new Error('AAAA records require a valid IPv6 address.');
    r.address = new URL(`http://[${r.address}]/`).hostname.slice(1, -1);
  }
  for (const key of ['cname', 'aliasName', 'nameserver', 'pointer', 'exchange', 'target', 'targetName']) {
    if (r[key] !== undefined) r[key] = targetName(r[key], ['target', 'targetName'].includes(key));
  }
  if (r.type === 'CAA') {
    r.value = r.value.replace(/^"(.*)"$/s, '$1');
  }
  if (r.type === 'SRV' && (!/^_[a-z0-9-]+$/.test(r.service) || !/^_[a-z0-9-]+$/.test(r.protocol))) throw new Error('SRV service and protocol need underscore-prefixed labels.');
  if (r.type === 'CNAME' && (r.name === '@' || r.cname === `${r.name}.${domain}`)) throw new Error('Apex or self-referencing CNAME records are not supported.');
  if (group !== undefined) r.group = group;
  return r;
}

export function stable(value) {
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).filter(k => value[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + stable(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
export function identity(r) { const { ttl, group, ...rest } = r; return stable(rest); }
export function recordKey(r) { const { group, ...rest } = r; return stable(rest); }
export function mailRecord(r) { return r.type === 'MX' || /(^|\.)(_domainkey|_dmarc|_mta-sts|_smtp\._tls)(\.|$)/i.test(r.name) || (r.type === 'TXT' && /^v=(spf1|DMARC1|DKIM1|STSv1|TLSRPTv1)/i.test(r.value)); }
export function writeRecord(r, deletion = false) {
  const { group, ...output } = r;
  if (deletion) delete output.ttl;
  else recordSchema.parse(output);
  return output;
}
export function normalizeSnapshot(raw, now = Date.now(), requireFresh = true) {
  const s = snapshotSchema.parse(raw);
  s.domain = domainName(s.domain);
  const age = now - Date.parse(s.capturedAt);
  if (requireFresh && (age < -60_000 || age > 10 * 60_000)) throw new Error('Snapshot is stale or future-dated. Fetch all DNS pages and the domain nameservers again.');
  s.items = s.items.map(r => normalizeRecord(r, s.domain, { reading: true }));
  s.nameservers.hosts = s.nameservers.hosts.map(n => targetName(n)).sort();
  s.omittedRecords = s.omittedRecords.map(r => ({ ...r, type: r.type.toUpperCase(), name: r.name.toLowerCase().replace(/\.$/, '') }));
  if (s.total !== s.items.length + s.omittedRecords.length) throw new Error('Incomplete DNS snapshot: fetch all pages and deduplicate omittedRecords before planning.');
  if (new Set(s.items.map(identity)).size !== s.items.length) throw new Error('Duplicate record identities in the snapshot; resolve pagination or provider ambiguity first.');
  return s;
}
export function fingerprint(snapshot) {
  return createHash('sha256').update(stable({ domain: snapshot.domain, nameservers: snapshot.nameservers, items: snapshot.items.map(stable).sort(), omittedRecords: snapshot.omittedRecords.map(stable).sort(), total: snapshot.total })).digest('hex');
}
export function validateZone(items) {
  for (const cname of items.filter(r => r.type === 'CNAME')) {
    if (items.some(r => r !== cname && r.name === cname.name)) throw new Error(`CNAME conflict at ${cname.name}: remove the exact conflicting record first.`);
  }
  for (const r of items.filter(r => r.type === 'TXT' && /^v=spf1(?:\s|$)/i.test(r.value))) {
    if (items.filter(x => x.type === 'TXT' && x.name === r.name && /^v=spf1(?:\s|$)/i.test(x.value)).length > 1) throw new Error(`Multiple SPF policies at ${r.name}; merge the policy instead of adding a second one.`);
  }
}
