import { Planner } from '../src/planner.mjs';
import { Namecheap } from './upstream';
import type { Env } from './worker';

export class WorkspaceEngine {
  constructor(private ctx: {storage: any}, private env: Pick<Env, 'WRITES_ENABLED'>, private createProvider: () => Pick<Namecheap, 'connect' | 'close' | 'domains' | 'snapshot' | 'call'> = () => new Namecheap()) {}
  private queue: Promise<unknown> = Promise.resolve();
  fetch(request: Request): Promise<Response> {
    const task = () => this.handle(request);
    const result = this.queue.then(task, task);
    this.queue = result.catch(() => {});
    return result;
  }
  alarm(): Promise<void> {
    const task = () => this.expire();
    const result = this.queue.then(task, task); this.queue = result.catch(() => {}); return result;
  }
  private async expire() {
    const plans = await this.ctx.storage.list({ prefix: 'plan:' });
    const now = Date.now();
    for (const [key, plan] of plans) {
      if (plan.expiresAt < now && !['applying', 'needs_attention'].includes(plan.status)) await this.ctx.storage.delete(key);
      // Keep partial-write evidence for 24 hours; no credentials are stored here.
      if (plan.createdAt + 86400_000 < now) { await this.ctx.storage.delete(key); if (await this.ctx.storage.get(`lock:${plan.domain}`) === plan.id) await this.ctx.storage.delete(`lock:${plan.domain}`); }
    }
    if ((await this.ctx.storage.list({ prefix: 'plan:', limit: 1 })).size) await this.ctx.storage.setAlarm(now + 60_000);
  }
  private async handle(request: Request): Promise<Response> {
    // This class has no public route. Only the authenticated MCP handler can call
    // the internal Durable Object binding, whose ID derives from the verified subject.
    const body = await request.json() as any;
    const nc = this.createProvider();
    try {
      const established = await this.ctx.storage.get('subject');
      if (established && established !== body.subject) throw new Error('Account isolation check failed.');
      if (!established) await this.ctx.storage.put('subject', body.subject);
      const bucket = Math.floor(Date.now() / 60_000);
      const rate = await this.ctx.storage.get('rate');
      const count = rate?.bucket === bucket ? rate.count + 1 : 1;
      if (count > 20) throw new Error('Account request limit reached. Wait one minute.');
      await this.ctx.storage.put('rate', { bucket, count });
      await nc.connect(body.token);
      const { action, args } = body;
      if (action === 'domains') return Response.json(await nc.domains(args.take, args.skip));
      if (action === 'records') return Response.json(await nc.snapshot(args.domain));
      if (action === 'plan') {
        const snapshot = await nc.snapshot(args.domain);
        if (await this.ctx.storage.get(`lock:${snapshot.domain}`)) throw new Error('An earlier change has an uncertain result. Reconcile that plan before creating another.');
        if ((await this.ctx.storage.list({ prefix: 'plan:', limit: 50 })).size >= 50) throw new Error('Too many retained plans; wait for expiry.');
        const planner = new Planner(), preview = planner.prepare(snapshot, args.operations);
        const plan = planner.get(preview.planId);
        await this.ctx.storage.put(`plan:${plan.id}`, { ...plan, status: 'preview' });
        await this.ctx.storage.setAlarm(Date.now() + 60_000);
        return Response.json({ ...preview, note: 'Server-fetched account snapshot. Apply only within the user’s authorized scope. Plan expires in ten minutes.' });
      }
      const stored = await this.ctx.storage.get(`plan:${args.planId}`);
      if (!stored) throw new Error('Plan not found in this connected account.');
      if (action === 'reconcile') {
        const snapshot = await nc.snapshot(stored.domain);
        const planner = new Planner(); planner.plans.set(stored.id, { ...stored, expiresAt: Date.now() + 60_000 });
        const result = planner.verify(stored.id, snapshot);
        if (stored.status === 'verified') return Response.json({ ...result, snapshot });
        await this.ctx.storage.put(`plan:${stored.id}`, { ...stored, status: 'reconciled', lastVerification: result.status });
        if (await this.ctx.storage.get(`lock:${stored.domain}`) === stored.id) await this.ctx.storage.delete(`lock:${stored.domain}`);
        return Response.json({ ...result, snapshot, note: 'Read-only reconciliation. No writes retried. If mismatched, create a new plan from current records.' });
      }
      if (action !== 'apply') throw new Error('Unsupported action.');
      if (stored.status === 'verified') return Response.json(stored.receipt);
      if (stored.status !== 'preview') throw new Error('This plan cannot be retried. Reconcile its current state and create a new plan if needed.');
      if (stored.expiresAt <= Date.now()) throw new Error('Plan expired. Prepare a fresh plan.');
      if (this.env.WRITES_ENABLED !== 'true') throw new Error('Live writes are not enabled for this beta deployment. Account reads and previews are available.');
      if (await this.ctx.storage.get(`lock:${stored.domain}`)) throw new Error('Another change for this domain needs reconciliation.');
      await this.ctx.storage.put({ [`lock:${stored.domain}`]: stored.id, [`plan:${stored.id}`]: { ...stored, status: 'applying' } });
      const planner = new Planner(); planner.plans.set(stored.id, stored);
      let completedSteps = 0;
      try {
        for (let i = 0; i < stored.steps.length; i++) {
          const snapshot = await nc.snapshot(stored.domain);
          const step = planner.next(stored.id, snapshot, i);
          await nc.call(step.call.tool, step.call.arguments);
          completedSteps++;
          await this.ctx.storage.put(`plan:${stored.id}`, { ...stored, status: 'applying', completedSteps });
        }
        const final = await nc.snapshot(stored.domain);
        const check = planner.verify(stored.id, final);
        if (check.status !== 'provider_state_verified') throw new Error('Provider read-back did not match the planned result.');
        const receipt = { ...check, completedSteps, appliedAt: new Date().toISOString(), note: 'Provider state verified. Public DNS, website HTTPS, and email delivery need separate checks.' };
        await this.ctx.storage.put(`plan:${stored.id}`, { ...stored, status: 'verified', receipt });
        await this.ctx.storage.delete(`lock:${stored.domain}`);
        return Response.json(receipt);
      } catch {
        await this.ctx.storage.put(`plan:${stored.id}`, { ...stored, status: 'needs_attention', completedSteps });
        return Response.json({ status: 'needs_attention', planId: stored.id, completedSteps, message: 'The write outcome may be partial or unknown. Run dns_reconcile_change before any new plan. No automatic rollback or replay.' }, { status: 409 });
      }
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : 'Request failed.' }, { status: 400 });
    } finally { await nc.close().catch(() => {}); }
  }
}
