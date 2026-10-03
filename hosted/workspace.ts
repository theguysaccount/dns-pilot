import { DurableObject } from 'cloudflare:workers';
import { DemoProvider } from './demo-provider';
import { WorkspaceEngine } from './workspace-core';
import type { Env } from './worker';
export class DNSWorkspace extends DurableObject<Env> {
  private engine = new WorkspaceEngine(this.ctx, this.env);
  private demoEngine = new WorkspaceEngine(this.ctx, { WRITES_ENABLED: 'true' }, () => new DemoProvider(this.ctx.storage));
  async fetch(request: Request) {
    const body = await request.clone().json() as any;
    if (body.mode === 'sandbox' && /^demo:[0-9a-f-]{36}$/.test(body.subject)) return this.demoEngine.fetch(request);
    if (body.mode === 'sandbox' || String(body.subject).startsWith('demo:')) return new Response('Invalid sandbox identity', { status: 403 });
    return this.engine.fetch(request);
  }
  alarm() { return this.engine.alarm(); }
}
