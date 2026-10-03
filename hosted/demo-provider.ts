import { identity, normalizeSnapshot } from '../src/records.mjs';

/** Isolated sample provider. Never calls Namecheap or writes public DNS. */
export class DemoProvider {
  constructor(private storage: any) {}
  async connect(_token: string) {}
  async close() {}
  async domains(take = 25, skip = 0) {
    return { items: skip === 0 && take > 0 ? [{ name: 'example.com', lifecycleStatus: 'SANDBOX' }] : [], total: 1, nextSkip: null };
  }
  async records() {
    return await this.storage.get('demo:records') ?? [
      { type: 'A', name: '@', address: '192.0.2.10', ttl: 1800 },
      { type: 'CNAME', name: 'www', cname: 'example.com', ttl: 1800 },
      { type: 'MX', name: '@', exchange: 'mail.example.com', preference: 10, ttl: 1800 },
      { type: 'TXT', name: '@', value: 'v=spf1 -all', ttl: 1800 },
      { type: 'TXT', name: '_dmarc', value: 'v=DMARC1; p=reject', ttl: 1800 }
    ];
  }
  async snapshot(domain: string) {
    if (domain !== 'example.com') throw new Error('This sandbox account contains only the simulated example.com zone. No access to other accounts or real DNS.');
    const items = await this.records();
    return normalizeSnapshot({ domain, capturedAt: new Date().toISOString(), nameservers: { provider: 'basic', hosts: ['ns1.example.com', 'ns2.example.com'] }, items, total: items.length, omittedRecords: [] });
  }
  async call(tool: string, args: any) {
    if (args.domainName !== 'example.com') throw new Error('Sandbox writes are restricted to simulated example.com records.');
    if (!['dns_records_save', 'dns_records_delete'].includes(tool)) throw new Error('Unsupported sandbox operation.');
    const items = await this.records();
    const kept = items.filter((r: any) => !args.records.some((x: any) => identity(x) === identity(r)));
    await this.storage.put('demo:records', tool === 'dns_records_save' ? [...kept, ...args.records] : kept);
    return { simulated: true };
  }
}
