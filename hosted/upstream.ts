import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { domainName, normalizeSnapshot } from '../src/records.mjs';

const allowed = new Set(['domains_list', 'dns_records_get', 'dns_records_save', 'dns_records_delete']);
export class Namecheap {
  client: Client;
  constructor() { this.client = new Client({ name: 'dns-pilot', version: '0.2.0' }); }
  async connect(token: string) {
    await this.client.connect(new StreamableHTTPClientTransport(new URL('https://mcp.namecheap.com/mcp'), { requestInit: { headers: { Authorization: `Bearer ${token}` }, redirect: 'manual' } }), { timeout: 15_000 });
  }
  async close() { await this.client.close(); }
  async call(name: string, args: Record<string, unknown>): Promise<any> {
    if (!allowed.has(name)) throw new Error('Unsupported provider action.');
    const result = await this.client.callTool({ name, arguments: args }, undefined, { timeout: 25_000 });
    if (result.isError) throw new Error('Namecheap rejected the request or could not confirm its outcome. Re-read DNS before retrying a write.');
    if (result.structuredContent) return result.structuredContent;
    const content = result.content as any[];
    for (const item of content ?? []) if (item.type === 'text') {
      try { const parsed = JSON.parse(item.text); if (parsed && typeof parsed === 'object') return parsed; } catch {}
    }
    throw new Error('Unexpected Namecheap response; no further action taken.');
  }
  async domains(take = 25, skip = 0) {
    const result = await this.call('domains_list', { take, skip });
    if (!Array.isArray(result.items) || !Number.isInteger(result.total)) throw new Error('Invalid domain list.');
    return { items: result.items.map((d: any) => ({ name: d.name, expirationDate: d.expirationDate, lifecycleStatus: d.lifecycleStatus, autoRenew: d.autoRenew })), total: result.total, nextSkip: skip + result.items.length < result.total ? skip + result.items.length : null };
  }
  async snapshot(input: string) {
    const domain = domainName(input);
    const info = await this.call('domains_list', { domain });
    const match = info.items?.find((d: any) => d.name?.toLowerCase() === domain);
    if (!match?.nameservers?.hosts?.length) throw new Error('Exact domain or nameserver details could not be verified in this account.');
    const items: any[] = [], omitted = new Map();
    let total: number | undefined;
    for (let skip = 0; skip < 5000; skip += 500) {
      const page = await this.call('dns_records_get', { domainName: domain, take: 500, skip });
      if (!Array.isArray(page.items) || !Number.isInteger(page.total) || page.total > 5000) throw new Error('Unsupported or incomplete DNS response.');
      if (total !== undefined && page.total !== total) throw new Error('DNS changed during pagination. Read again.');
      total = page.total; items.push(...page.items);
      for (const r of page.omittedRecords ?? []) omitted.set(`${r.type}:${r.name}`, { type: r.type, name: r.name });
      if (!page.items.length || items.length + omitted.size >= total!) break;
    }
    return normalizeSnapshot({ domain, capturedAt: new Date().toISOString(), nameservers: match.nameservers, items, total, omittedRecords: [...omitted.values()] });
  }
}

export async function publicDNS(name: string, type: string) {
  if (!/^[a-z0-9_.-]+$/i.test(name) || !name.includes('.') || name.length > 253) throw new Error('Invalid DNS hostname.');
  const servers = [['Cloudflare', 'https://cloudflare-dns.com/dns-query'], ['Google', 'https://dns.google/resolve']];
  const observations = await Promise.all(servers.map(async ([resolver, endpoint]) => {
    try {
      const url = new URL(endpoint); url.searchParams.set('name', name); url.searchParams.set('type', type);
      const response = await fetch(url, { headers: { Accept: 'application/dns-json' }, signal: AbortSignal.timeout(5000), redirect: 'manual' });
      if (!response.ok) return { resolver, status: 'error' };
      const data = await response.json() as any;
      return { resolver, status: data.Status === 0 ? (data.Answer?.length ? 'answer' : 'no_answer') : data.Status === 3 ? 'no_answer' : 'error', dnsStatus: data.Status, answers: data.Answer ?? [] };
    } catch { return { resolver, status: 'error' }; }
  }));
  return { name, type, checkedAt: new Date().toISOString(), observations, note: 'Recursive observations only. Not proof of worldwide propagation, authoritative state, HTTPS readiness, or email delivery.' };
}
