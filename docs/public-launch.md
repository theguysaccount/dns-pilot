# Public release status

As of October 2, 2026:

- Local Codex plugin: built, packaged, and installed in the author's personal marketplace. Account login remains unverified.
- Public website and controlled endpoint: deployed at https://dns-pilot.cuelayer.workers.dev with separate privacy, terms, and support pages and unique share cards.
- Hosted backend: implemented and fixture-tested. Connections are closed and writes disabled.
- OpenAI directory: hosted ZIP uploaded as a draft in the verified Personal organization. Domain ownership is verified and the workflow skill passed automated checks. Final status is **Not submitted**; not approved or listed.
- Portal draft: https://platform.openai.com/plugins/manage/plugin_asdk_app_6ac079ad82f88191ade560b44f32ef12
- Version ID: `appsub_6ac079ad831881919909c929486866ba`.

## Exact blockers

1. **Namecheap callback approval.** The `/register` response returned a client ID and an allowlist of AI-client redirect URIs, but did not include `https://dns-pilot.cuelayer.workers.dev/callback`. A real authorization attempt was rejected. A successful registration response is not sufficient. The release gate now explicitly checks the returned callback list. The alternate official connector advertises the same OAuth resource, so it does not establish an independent registration route.
2. **OpenAI developer verification is cleared.** The Personal organization now shows Verified and accepted the ZIP using its verified individual identity.
3. **Live integration and review evidence.** A dedicated review account and permitted test domain, actual authenticated read/write/read-back, refresh/revocation checks, failure recovery, and an actual walkthrough video are still required. No review credentials or video links are fabricated.
4. **Final portal submission is blocked.** The exact challenge token is deployed through `OPENAI_CHALLENGE`, and the portal confirms Domain verified. The corrected subtitle satisfies the 30-character limit. The skill status is Checks passed. A category confirmation warning and MCP setup findings remain; the final dialog labels these nonblocking. It separately blocks submission on incomplete review information, including the missing walkthrough URL. Working reviewer credentials are unavailable. No compliance attestations were checked, and Submit remains disabled.


## Prepared materials

`submission/namecheap-dns/` contains a single-remote-MCP Codex-format draft, current website/support/privacy/terms URLs, branding, workflow skill, five positive scenarios, three negative scenarios, and candid release notes. Its OpenAI review extensions and `supportURL` follow the current official submission documentation. The bundled local Plugin Creator validator predates these public-submission fields and rejects them; the local plugin uses the older accepted shape and validates separately. The live portal accepted the manifest and review extensions; skill checks passed. The original subtitle length issue was corrected and reuploaded. The remaining category warning and incomplete connection/review information are recorded above.

The reviewer sign-in instructions saved in the portal explicitly disclose the unavailable hosted sign-in, missing reviewer credentials and demonstration, and disabled connections/writes.

`docs/namecheap-integration-request.md` contains the precise request needed from the provider. It has not been sent. Do not reuse another app's allowlisted redirect URI, impersonate a registered client, or present Namecheap's MCP host as a domain we own.

The fallback is a separately designed API-key service using Namecheap's legacy API with allowlisted IPv4 egress. That is not implemented by this release; it requires secure credential onboarding, stable egress, and complete preservation of replace-all DNS records and mail mode.

References: [OpenAI submission](https://developers.openai.com/plugins/deploy/submission), [Namecheap MCP](https://www.namecheap.com/support/knowledgebase/article.aspx/10824/34/namecheap-mcp/), [Namecheap MCP Connector](https://www.namecheap.com/support/knowledgebase/article.aspx/10836/34/namecheap-mcp-connector-tools-reference/).
