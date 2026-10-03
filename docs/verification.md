# Release verification

Recorded October 2, 2026. Local and hosted states are separate.

## Automated evidence

- 26 tests pass. Coverage includes exact record preservation, replacement and TTL semantics, mail flags, incomplete/stale snapshots, drift and nameservers, managed/omitted records, CNAME/SPF conflicts, TXT fidelity, IDNs, error classification, account isolation, durable concurrent-write serialization, idempotent receipts, unknown outcomes, read-only reconciliation, write gate, request budget, and expiry lock ownership.
- The bundled local MCP starts outside its source directory, lists four tools, and completes a fixture plan/check/verify exchange through the official SDK.
- Hosted TypeScript compilation and Cloudflare deployment succeed. Hosted write tests use a mock provider, never customer DNS.
- The local plugin and both workflow skills validate. The public manifest uses newer OpenAI review fields not recognized by the bundled local validator; the live portal accepted the hosted package and review extensions. The hosted skill passed automated checks. A 30-character subtitle check is now enforced by the packaging script.
- Four public pages return HTTP 200 with canonical URLs, descriptions, Open Graph and Twitter metadata. All four distinct 1200×630 PNG share images return image/png. Robots, sitemap, CSS, and icon are reachable.
- Live public boundaries return 401 for missing and forged tokens. OAuth metadata identifies the controlled resource and S256. Foreign-origin consent and forged callback state are rejected. Hosted health reports writes disabled and connections not ready.

## Browser and integration evidence

- The live landing page was visually inspected at desktop and 390px widths with no horizontal overflow; its sample preview is explicitly illustrative.
- A real consent form was rendered and tested. Browser testing found a form-redirect CSP issue, which was repaired with exact provider/validated-client destinations.
- Namecheap's DCR response did not include the requested hosted callback. Its authorization endpoint rejected that callback. Connections were therefore closed; no hosted account authorization or DNS read completed.
- The alternate official Namecheap connector advertises the same OAuth resource and issuer. This does not establish permission for a hosted callback.
- The OpenAI Personal organization now shows Verified. Hosted ZIP upload succeeded and created draft `plugin_asdk_app_6ac079ad82f88191ade560b44f32ef12`, version `appsub_6ac079ad831881919909c929486866ba`.
- The public ownership challenge was deployed as a Worker secret, fetched successfully, and verified by the portal. The portal still requires OAuth authorization before tool discovery.
- Skill checks passed. The subtitle error was corrected and the ZIP reuploaded. Category confirmation and MCP setup findings remain. The final submission dialog calls those findings nonblocking but disables Submit for incomplete review information; no walkthrough URL or working reviewer credentials are available. Honest sign-in limitation notes were saved.
- No live DNS mutation, purchase, nameserver change, final directory submission, legal attestation, or fabricated account/demo material occurred.
- After setting the challenge, public health still reports `writesEnabled: false` and `connectionReady: false`.


Full source, package checksums, and release status accompany the published artifacts. Test credentials and temporary OAuth state are excluded from source and ZIPs. Task-created browser tabs are closed after verification; the saved portal draft URL is recorded in the release status.
