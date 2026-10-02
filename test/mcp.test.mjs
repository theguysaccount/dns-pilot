import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { resolve } from 'node:path';
test('bundled MCP starts outside its source directory and completes plan/check/verify', async () => {
  const client = new Client({ name: 'dns-pilot-test', version: '1.0.0' });
  const transport = new StdioClientTransport({ command: process.execPath, args: [resolve('dist/server.mjs')], cwd: '/tmp', stderr: 'pipe' });
  try {
    await client.connect(transport);
    const tools = await client.listTools();
    assert.deepEqual(tools.tools.map(t => t.name).sort(), ['dns_lookup', 'dns_next_step', 'dns_plan_change', 'dns_verify_change']);
    assert.ok(tools.tools.every(t => t.annotations.readOnlyHint));
    const snapshot = { domain: 'example.com', capturedAt: new Date().toISOString(), nameservers: { provider: 'basic', hosts: ['dns1.registrar-servers.com'] }, items: [], total: 0, omittedRecords: [] };
    const record = { type: 'TXT', name: '@', value: 'verification=fixture', ttl: 1800 };
    const plan = await client.callTool({ name: 'dns_plan_change', arguments: { snapshot, operations: [{ action: 'add', record }] } });
    assert.ok(!plan.isError, JSON.stringify(plan));
    const planId = plan.structuredContent.planId;
    const next = await client.callTool({ name: 'dns_next_step', arguments: { planId, snapshot, stepIndex: 0 } });
    assert.equal(next.structuredContent.call.tool, 'dns_records_save');
    const verify = await client.callTool({ name: 'dns_verify_change', arguments: { planId, snapshot: { ...snapshot, items: [record], total: 1 } } });
    assert.equal(verify.structuredContent.status, 'provider_state_verified');
    const drift = await client.callTool({ name: 'dns_next_step', arguments: { planId, snapshot: { ...snapshot, items: [record], total: 1 }, stepIndex: 0 } });
    assert.equal(drift.isError, true);
  } finally { await client.close(); }
});
