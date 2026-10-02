# Public release status

As of October 2, 2026:

- Local Codex plugin: built, packaged, and installed in the author's personal marketplace. Account login remains unverified.
- Public website and controlled endpoint: deployed at https://dns-pilot.cuelayer.workers.dev with separate privacy, terms, and support pages and unique share cards.
- Hosted backend: implemented and fixture-tested. Connections are closed and writes disabled.
- OpenAI directory: not uploaded, submitted, approved, or listed.

## Exact blockers

1. **Namecheap callback approval.** The `/register` response returned a client ID and an allowlist of AI-client redirect URIs, but did not include `https://dns-pilot.cuelayer.workers.dev/callback`. A real authorization attempt was rejected. A successful registration response is not sufficient. The release gate now explicitly checks the returned callback list. The alternate official connector advertises the same OAuth resource, so it does not establish an independent registration route.
2. **OpenAI developer verification.** The personal organization can manage submissions; its latest status is **Identity in review**, not approved. The other accessible organization is business-preverified but the account lacks plugin-submission permission. A Persona individual-verification inquiry was opened; the settings page subsequently showed Identity in review. No identity details or biometrics were supplied by this project.
3. **Live integration and review evidence.** A dedicated review account and permitted test domain, actual authenticated read/write/read-back, refresh/revocation checks, failure recovery, and an actual walkthrough video are still required. No review credentials or video links are fabricated.
4. **Domain challenge and portal review.** Once verification permits draft upload, publish the exact portal token through `OPENAI_CHALLENGE` at `/.well-known/openai-apps-challenge`, verify ownership, upload the ZIP, resolve scan results, complete review evidence and attestations, and submit. The challenge route currently returns 404 because no token has been issued.

## Prepared materials

`submission/namecheap-dns/` contains a single-remote-MCP Codex-format draft, current website/support/privacy/terms URLs, branding, workflow skill, five positive scenarios, three negative scenarios, and candid release notes. Its OpenAI review extensions and `supportURL` follow the current official submission documentation. The bundled local Plugin Creator validator predates these public-submission fields and rejects them; the local plugin uses the older accepted shape and validates separately. Portal schema/scan validation remains pending.

`docs/namecheap-integration-request.md` contains the precise request needed from the provider. It has not been sent. Do not reuse another app's allowlisted redirect URI, impersonate a registered client, or present Namecheap's MCP host as a domain we own.

The fallback is a separately designed API-key service using Namecheap's legacy API with allowlisted IPv4 egress. That is not implemented by this release; it requires secure credential onboarding, stable egress, and complete preservation of replace-all DNS records and mail mode.

References: [OpenAI submission](https://developers.openai.com/plugins/deploy/submission), [Namecheap MCP](https://www.namecheap.com/support/knowledgebase/article.aspx/10824/34/namecheap-mcp/), [Namecheap MCP Connector](https://www.namecheap.com/support/knowledgebase/article.aspx/10836/34/namecheap-mcp-connector-tools-reference/).
