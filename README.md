# DNS Pilot

Independent DNS workflows: preview exact changes, preserve unrelated records, flag email changes, and verify provider state separately from public DNS.

**DNS Pilot 0.2.2 is approved and published in the OpenAI directory as of October 8, 2026.** [DNS Pilot ChatGPT listing](https://chatgpt.com/plugins/plugin_asdk_app_6ac079ad82f88191ade560b44f32ef12). The hosted public DNS lookup passes direct service tests, but ChatGPT installation currently fails while loading the included app connection; see [connection incident](docs/openai-connection-incident.md). Hosted Namecheap account connections and live writes remain disabled pending provider callback approval; sample record actions use an isolated reviewer workspace.

[Website](https://dns-pilot.cuelayer.workers.dev) · [Downloads](https://github.com/theguysaccount/dns-pilot/releases) · [Support](https://dns-pilot.cuelayer.workers.dev/support) · [Release status](docs/public-launch.md)

## Local Codex plugin

Install the plugin package in a personal Codex marketplace, then connect Namecheap through its own sign-in. Node.js 20+ is required on PATH. The bundled planner needs no npm installation. In the author's workspace the plugin is registered as `namecheap-dns@personal`.

This edition has two MCP components:

- Official Namecheap remote connection, restricted in configuration to `domains_list`, `dns_records_get`, `dns_records_save`, and `dns_records_delete`.
- Local planner with `dns_plan_change`, `dns_next_step`, `dns_verify_change`, and `dns_lookup`.

Start with “Inspect the DNS for my exact domain and identify its website and email records.” Supply exact provider values before requesting a change. The host's existing user authorization governs execution. Credentials never belong in chat. Account sign-in has not been validated in this release; Namecheap officially documents Claude as its tested client.

The local planner enforces workflow checks, but the official provider's write tools remain independently callable. It is not a server-side authorization boundary. Plans remain in process memory for ten minutes. The local companion stores no account credentials and makes public lookups through Cloudflare and Google.

## Hosted implementation

The `hosted/` source implements a separate OAuth-protected MCP service using Cloudflare Workers, KV and one Durable Object per verified account. It uses the official MCP SDK and Cloudflare OAuth provider library. Tokens are encrypted in the OAuth grant; record snapshots and reconciliation receipts are isolated by the verified account identifier.

The service implements six tools: domain listing, complete-record reads, server-fetched change previews, serialized application, read-only reconciliation, and public DNS lookup. An unknown write outcome is durably locked until reconciliation. A verified plan returns its receipt on retry rather than writing again.

**Both connection and live-write gates are closed.** OAuth client registration must return our exact callback URL before `NAMECHEAP_OAUTH_READY` is enabled. `WRITES_ENABLED` must remain false until a dedicated test account completes authenticated reads, explicit sandbox writes, read-back, failure recovery, and revocation checks. Do not bypass the provider's callback restrictions.

The public directory draft is under `submission/namecheap-dns/`. It uses one controlled HTTPS MCP endpoint with no local executable. Five positive and three negative review cases are included. This package is intentionally not labeled ready for submission.

## Record safeguards and limits

The planner rejects incomplete or stale snapshots, custom nameservers, managed-record edits, ambiguous identities, CNAME conflicts, duplicate SPF, edits at omitted-record hostnames, and last-record deletion. It normalizes supported values without changing TXT case or whitespace. Unrelated records are preserved; explicit mail changes are flagged.

A value replacement can require delete then save with a temporary gap. An outside dashboard or another client can race a check and write; there is no atomic provider transaction. Omitted URL/FRAME and malformed exotic records cannot be backed up or verified. Recursive answers are not proof of worldwide propagation, HTTPS readiness, or email delivery.

## Development

```sh
npm ci
npm run check
npm run typecheck
npm run build:site
npm run package
npm run package:submission
```

The test suite covers record semantics, real local MCP transport, account isolation, duplicate/concurrent application, drift, uncertain writes, reconciliation, rate limits, registration validation, and expiry cleanup. Hosted account operations are tested with fixtures, not a live customer account.

Copy `wrangler.example.jsonc` to `wrangler.jsonc`, provision your own KV namespace, and fill your own account, origin and approved provider client. Deployment config, test credentials, and account data are ignored by Git. `npm run verify:site` validates the live site's metadata, distinct share images, and public authentication boundaries.

See [research](docs/research.md), [record contract](docs/record-reference.md), [verification evidence](docs/verification.md), and [public release gates](docs/public-launch.md). Independent project developed and operated by Jackson Alan Jesionowski (Jack Jay); not affiliated with or endorsed by Namecheap or OpenAI.

## Publisher and review status

DNS Pilot is developed and operated by Jackson Alan Jesionowski (Jack Jay), its verified individual publisher. Namecheap is a third-party integration; its brand and trademark are not owned by this project. The October 5 OpenAI review requested ownership verification. The 0.2.2 hosted revision aligns the public publisher and package identity. OpenAI approved the revision, and publication was completed October 8. The ChatGPT listing was directly verified with version 0.2.2 and an Install plugin button. Real hosted Namecheap access still awaits provider callback approval.
