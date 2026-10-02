import { randomUUID } from 'node:crypto';
import { operationSchema, normalizeRecord, normalizeSnapshot, fingerprint, identity, recordKey, mailRecord, writeRecord, validateZone } from './records.mjs';

const SNAPSHOT_TTL = 10 * 60_000;
export class Planner {
  constructor({ now = () => Date.now() } = {}) { this.plans = new Map(); this.now = now; }
  prune() { for (const [id, p] of this.plans) if (p.expiresAt <= this.now()) this.plans.delete(id); }
  get(id) { this.prune(); const p = this.plans.get(id); if (!p) throw new Error('Plan not found or expired. Prepare a fresh plan.'); return p; }
  prepare(rawSnapshot, rawOperations) {
    this.prune();
    if (this.plans.size >= 50) throw new Error('Too many pending plans. Restart the planner or allow old plans to expire.');
    const snapshot = normalizeSnapshot(rawSnapshot, this.now());
    if (snapshot.nameservers.provider !== 'basic') throw new Error('This domain uses custom nameservers. Make DNS changes at its authoritative DNS provider; do not switch nameservers to make an edit work.');
    if (!rawOperations.length || rawOperations.length > 50) throw new Error('Use 1–50 exact record operations per plan.');
    const operations = rawOperations.map(o => operationSchema.parse(o));
    let items = structuredClone(snapshot.items);
    const steps = [], diff = [], warnings = [], states = [structuredClone(snapshot)];
    let mailChanged = false;
    const assertEditable = r => {
      if (r.group && r.group !== 'custom') throw new Error('Product-managed and personal nameserver records must be changed in the owning product.');
      if (r.type === 'NS' && r.name === '@') throw new Error('Apex nameserver migration is outside this DNS-record plugin.');
      if (snapshot.omittedRecords.some(o => o.name === r.name)) throw new Error(`Namecheap omitted a record at ${r.name}. Inspect it in the dashboard before changing that hostname.`);
    };
    const addStep = (tool, record, next) => {
      validateZone(next);
      steps.push({ tool, arguments: { domainName: snapshot.domain, records: [writeRecord(record, tool === 'dns_records_delete')], ...(tool === 'dns_records_save' ? { force: false } : {}) } });
      items = next;
      states.push({ ...structuredClone(snapshot), items: structuredClone(items), total: items.length + snapshot.omittedRecords.length });
    };
    for (const op of operations) {
      const before = op.action === 'add' ? null : normalizeRecord(op.action === 'replace' ? op.before : op.record, snapshot.domain);
      const after = op.action === 'remove' ? null : normalizeRecord(op.action === 'replace' ? op.after : op.record, snapshot.domain);
      if (before) assertEditable(before);
      if (after) assertEditable(after);
      let old;
      if (before) {
        const matches = items.filter(r => identity(r) === identity(before));
        if (matches.length !== 1) throw new Error('The exact record to remove or replace was not found once. Read DNS again and use its exact identity.');
        old = matches[0]; assertEditable(old);
        if (before.ttl !== undefined && before.ttl !== old.ttl) throw new Error('Record TTL changed since selection. Read DNS again.');
      }
      if (after) {
        after.ttl ??= old?.ttl ?? 1800;
        writeRecord(after);
        const existing = items.find(r => identity(r) === identity(after));
        if (!old && existing) {
          assertEditable(existing);
          if (recordKey(existing) === recordKey(after)) continue;
          throw new Error('This record already exists with a different TTL. Use replace to preview the TTL change.');
        }
        if (existing && old && existing !== old) throw new Error('Replacement would collide with another existing record.');
      }
      if (old && after && recordKey(old) === recordKey(after)) continue;
      if (mailRecord(old ?? after) || (after && mailRecord(after))) mailChanged = true;
      diff.push({ action: op.action, ...(old ? { before: old } : {}), ...(after ? { after } : {}) });
      if (old && after && identity(old) === identity(after)) {
        const replacement = { ...after, ...(old.group ? { group: old.group } : {}) };
        addStep('dns_records_save', after, items.map(r => r === old ? replacement : r));
      } else {
        if (old) addStep('dns_records_delete', old, items.filter(r => r !== old));
        if (after) addStep('dns_records_save', after, [...items, { ...after, group: 'custom' }]);
        if (old && after) warnings.push('A value replacement uses delete then save: there is a temporary record gap. Stop and re-read on any error; do not blindly retry or automatically restore.');
      }
    }
    if (items.length === 0 && snapshot.items.length > 0) throw new Error('Deleting the last visible DNS record is outside this plugin.');
    validateZone(items);
    if (mailChanged) warnings.push('This plan changes email-related DNS. Apply only when the user authorized this mail change; report any delivery or verification impact.');
    if (snapshot.omittedRecords.length) warnings.push('Omitted provider records are left untouched. Their contents cannot be backed up or verified through this MCP contract.');
    if (diff.some(d => (d.before ?? d.after).type === 'SRV')) warnings.push('Namecheap may report SRV saves without confirming a read-back. Verify SRV independently before calling it complete.');
    const plan = { id: randomUUID(), domain: snapshot.domain, createdAt: this.now(), expiresAt: this.now() + SNAPSHOT_TTL, snapshot, states, steps, diff, warnings: [...new Set(warnings)], mailChanged };
    this.plans.set(plan.id, plan);
    const expiry = setTimeout(() => this.plans.delete(plan.id), SNAPSHOT_TTL);
    expiry.unref?.();
    return { planId: plan.id, domain: plan.domain, expiresAt: new Date(plan.expiresAt).toISOString(), status: steps.length ? 'preview' : 'no_changes', diff, mailChanged, warnings: plan.warnings, stepCount: steps.length, unchangedRecordCount: snapshot.items.filter(r => items.some(x => recordKey(r) === recordKey(x))).length, beforeFingerprint: fingerprint(snapshot), backup: snapshot, note: 'A preview does not authorize a change. The host must use existing user authorization or obtain missing approval. These are workflow checks; the upstream tools are independently callable.' };
  }
  next(id, rawSnapshot, stepIndex) {
    const p = this.get(id);
    if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= p.steps.length) throw new Error('Invalid step index.');
    const current = normalizeSnapshot(rawSnapshot, this.now());
    if (!sameState(current, p.states[stepIndex])) throw new Error('DNS drift detected. Stop, re-read, and prepare a new plan from the current state.');
    return { status: 'ready_for_authorized_execution', planId: id, stepIndex, call: p.steps[stepIndex], remainingSteps: p.steps.length - stepIndex - 1, note: 'Check user authorization, execute this exact upstream call once, then fetch the full zone before the next step. No server-side transaction lock exists.' };
  }
  verify(id, rawSnapshot) {
    const p = this.get(id), current = normalizeSnapshot(rawSnapshot, this.now());
    const expected = p.states.at(-1);
    const sameDomain = current.domain === p.domain;
    const key = r => recordKey(r);
    return { planId: id, domain: p.domain, status: sameState(current, expected) ? 'provider_state_verified' : 'mismatch', missing: expected.items.filter(r => !sameDomain || !current.items.some(x => key(x) === key(r))), unexpected: current.items.filter(r => !sameDomain || !expected.items.some(x => key(x) === key(r))), note: 'This compares supplied provider snapshots. Public recursive DNS, HTTPS, and mail delivery are separate checks. Omitted record contents are not verified.' };
  }
}

function sameState(a, b) {
  // Provider may omit group=custom on read-back; managed groups stay material.
  const canonical = s => ({ ...s, items: s.items.map(r => ({ ...r, group: r.group ?? 'custom' })) });
  return fingerprint(canonical(a)) === fingerprint(canonical(b));
}
