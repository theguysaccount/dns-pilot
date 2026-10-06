# Release verification

Updated October 6, 2026. Local, reviewer sandbox, and live Namecheap states are separate.

## Automated evidence

- 28 tests pass. Coverage includes record preservation, replacement/TTL semantics, mail flags, stale/incomplete snapshots, drift and nameservers, omitted records, CNAME/SPF conflicts, TXT fidelity, IDNs, account isolation, concurrent-write serialization, idempotent receipts, unknown outcomes, reconciliation, write gates, request budgets, expiry locks, reviewer authentication/CSRF, and isolated sandbox mutation/read-back.
- The bundled local MCP starts outside its source directory, lists four tools, and completes a fixture plan/check/verify exchange through the official SDK.
- Hosted TypeScript compilation and Cloudflare deployment succeed. No test mutates customer DNS.
- Direct deployed HTTP verification completed OAuth registration, PKCE consent, token exchange, six-tool discovery, sandbox list/read/preview/apply/reconcile, real Cloudflare and Google NS answers, out-of-account rejection, missing purchase tool, mail-change warning without applying, and refresh. Run `node scripts/verify-review.mjs` with the private reviewer credential file. Sanitized evidence is in `.private/review-verification.json`.
- Local plugin and workflow skills validate. The portal accepted the hosted package and public-review extensions; its workflow skill passed. The package script enforces the 30-character subtitle limit.
- Four public pages return HTTP 200 with canonical URLs, descriptions, Open Graph and Twitter metadata. Four distinct 1200x630 PNG cards return image/png. Robots, sitemap, CSS, and icon are reachable.
- Missing/forged tokens return 401. OAuth metadata identifies the controlled resource and S256. Foreign-origin consent, forged callback state, and unauthenticated reviewer actions are rejected. Reviewer sessions use secure HttpOnly cookies, strict same-origin POST validation and isolated sample accounts. The best-effort login rate limit uses short-lived hashed-IP counters.
- Health reports `reviewerSandboxReady: true`, `writesEnabled: false`, and `connectionReady: false`. These last two fields refer to the live Namecheap provider.

## Browser and portal evidence

- Landing page visually inspected at desktop and 390px widths; no horizontal overflow and illustrative previews explicitly labeled.
- Dedicated reviewer login and OAuth consent completed in Chrome. Form referrer policy was corrected to preserve Origin for strict same-origin validation. Server fetch redirect mode is manual because Workers rejects the unsupported error mode; provider credentials are never forwarded through a redirect.
- OpenAI Personal developer identity and endpoint domain are Verified. The portal completed sandbox OAuth authorization and discovered all six tools. Its latest MCP scan reports No issues found after correcting the saved-plan tool's readOnlyHint to false. Saving a preview is a workspace mutation, although it never changes provider DNS.
- Dedicated login URL, tenant description, username, password, and sandbox instructions saved in OpenAI's secure reviewer form. Five positive and three negative cases plus recording URL imported from the ZIP.
- The 123.93-second screen recording is an actual browser capture with permanent on-screen captions. Its public MP4 URL returns video/mp4 and played in Chrome with readyState 4, advancing time, and no media error. It shows synthetic provider actions and real public DNS checks. Negative cases verify server mechanisms, not a separately tested model conversation.
- Namecheap's requested callback is still unapproved, so no real Namecheap account authorization, live account DNS read, or live DNS mutation occurred.
- OpenAI received the initial submission October 3. The October 5 review requested ownership verification. Portal status checked October 6 was Changes required / Not published. Hosted revision 0.2.2 was uploaded under Individual — JACKSON ALAN JESIONOWSKI, and its developer field now displays Jackson Alan Jesionowski. Approval and publication remain unconfirmed.
- Ownership revision deployed as Cloudflare version 735f1adb-1e91-477d-9baf-3167593382ed. All 28 tests, hosted typecheck and public-page checks passed. Four unique public share cards now use the independent DNS Pilot branding. Every public page identifies the same legal publisher.

## Privacy and release boundaries

Reviewer credentials and temporary OAuth state are excluded from source and ZIPs. The public recording contains only synthetic account data. Private reviewer, consent, and error pages are share-artwork exceptions and use noindex; all four public pages have page-specific cards. Existing immutable beta release assets are not overwritten by this reviewer update.

October 6 direct deployed verification: OAuth PKCE and refresh, six discovered tools, all five positive review cases and three negative mechanisms passed. Public DNS answers came from both Cloudflare and Google. A transient connection timeout on the first attempt cleared on the subsequent run. Current portal draft 0.2.2 is configured, domain verified, authorized, with No issues found in the MCP scan. Reviewer details are saved. Final legal attestations remain unchecked and no resubmission is claimed.
