import { DurableObject } from 'cloudflare:workers';
import { WorkspaceEngine } from './workspace-core';
import type { Env } from './worker';
export class DNSWorkspace extends DurableObject<Env> {
  private engine = new WorkspaceEngine(this.ctx, this.env);
  fetch(request: Request) { return this.engine.fetch(request); }
  alarm() { return this.engine.alarm(); }
}
