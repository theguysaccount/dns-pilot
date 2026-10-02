# Release verification

Recorded October 2, 2026. Local and hosted states are separate.

## Automated evidence

- 26 tests pass. Coverage includes exact record preservation, replacement and TTL semantics, mail flags, incomplete/stale snapshots, drift and nameservers, managed/omitted records, CNAME/SPF conflicts, TXT fidelity, IDNs, error classification, account isolation, durable concurrent-write serialization, idempotent receipts, unknown outcomes, read-only reconciliation, write gate, request budget, and expiry lock ownership.
- The bundled local MCP starts outside its source directory, lists four tools, and completes a fixture plan/check/verify exchange through the official SDK.
- Hosted TypeScript compilation and Cloudflare deployment succeed. Hosted write tests use a mock provider, never customer DNS.
- The local plugin and both workflow skills validate. The public manifest uses newer OpenAI review fields not recognized by the bundled local validator; portal validation remains pending.
- Four public pages return HTTP 200 with canonical URLs, descriptions, Open Graph and Twitter metadata. All four distinct 1200×630 PNG share images return image/png. Robots, sitemap, CSS, and icon are reachable.
- Live public boundaries return 401 for missing and forged tokens. OAuth metadata identifies the controlled resource and S256. Foreign-origin consent and forged callback state are rejected. Hosted health reports writes disabled and connections not ready.

## Browser and integration evidence

- The live landing page was visually inspected at desktop and 390px widths with no horizontal overflow; its sample preview is explicitly illustrative.
- A real consent form was rendered and tested. Browser testing found a form-redirect CSP issue, which was repaired with exact provider/validated-client destinations.
- Namecheap's DCR response did not include the requested hosted callback. Its authorization endpoint rejected that callback. Connections were therefore closed; no hosted account authorization or DNS read completed.
- The alternate official Namecheap connector advertises the same OAuth resource and issuer. This does not establish permission for a hosted callback.
- The OpenAI personal organization blocked upload before developer verification. Another visible organization was preverified but lacked submission permission for this user. The personal identity flow reached Persona's biometric-consent step; a later settings check showed **Identity in review**. Approval is not yet established.
- No live DNS mutation, purchase, nameserver change, directory submission, or fabricated account/demo material occurred.

Full source, package checksums, and release status accompany the published artifacts. Test credentials and temporary OAuth state are excluded from source and ZIPs. The identity-verification browser tab is retained only as a user handoff; other task tabs are closed after verification.
