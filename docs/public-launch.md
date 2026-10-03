# Public release status

As of October 3, 2026:

- Local Codex plugin: built, packaged, and installed in the author's personal marketplace. Real Namecheap account login remains unverified.
- Public website and controlled endpoint: deployed at https://dns-pilot.cuelayer.workers.dev with separate privacy, terms, and support pages and unique share cards.
- Reviewer access: working dedicated sandbox credentials saved privately in OpenAI's review dashboard. Login requires no MFA, email code, or additional setup. Every sign-in creates an isolated synthetic example.com workspace. Credentials are excluded from this repository and submission ZIP.
- Captioned screen recording: [2:04 walkthrough](https://dns-pilot.cuelayer.workers.dev/review-media/dns-pilot-captioned-walkthrough.mp4). Actual browser capture demonstrates the deployed MCP handler, synthetic read/preview/apply/read-back, public DNS observations, and safety mechanisms. It does not claim live Namecheap access or demonstrate model conversation routing.
- OpenAI: verified Personal organization, verified domain, OAuth authorized, all six tools discovered, and latest MCP scan reports **No issues found**. Final status is **Not submitted**, awaiting the owner's final legal attestations; not approved or listed.
- Portal draft: https://platform.openai.com/plugins/manage/plugin_asdk_app_6ac079ad82f88191ade560b44f32ef12
- Version ID: `appsub_6ac079ad831881919909c929486866ba`.
- Worker deployment: `6eb72e8d-0dab-43cb-afe4-3f64e156d09d`.

## Live provider limitation

Namecheap has not approved `https://dns-pilot.cuelayer.workers.dev/callback`. Its registration response returned a client ID and an allowlist of AI-client redirect URIs without this callback, and a real authorization attempt was rejected. The alternate official connector advertises the same OAuth resource. Registration alone does not establish permission.

Real Namecheap connections and live DNS writes remain disabled. The reviewer sandbox uses a separate synthetic provider and isolated workspaces; enabling sandbox writes cannot enable live Namecheap writes. Live account reads, mutations, failure recovery, refresh and revocation still require provider approval and real end-to-end verification.

`docs/namecheap-integration-request.md` contains the precise provider request. It has not been sent. Do not reuse another app's allowlisted redirect URI, impersonate a registered client, or present Namecheap's MCP host as a domain we own.

## Submission materials

`submission/namecheap-dns/` contains a single-remote-MCP plugin, current website/support/privacy/terms URLs, branding, workflow skill, five positive scenarios, three negative scenarios, recording URL, and release notes disclosing sandbox-only provider access. The category is Developer Tools. The portal accepted the manifest extensions, and the workflow skill passed automated checks. The older bundled validator does not recognize newer public-review fields.

The saved reviewer instructions explain both OAuth connection and the private review console, real public DNS lookup versus synthetic account data, and the pending Namecheap callback approval. Final legal checkboxes have not been accepted automatically.

The private `/review` console and consent/error pages are documented exceptions to public-page share artwork. Review pages and the recording return noindex directives; four public marketing/legal/support pages have distinct verified social cards.

References: [OpenAI submission](https://developers.openai.com/plugins/deploy/submission), [Namecheap MCP](https://www.namecheap.com/support/knowledgebase/article.aspx/10824/34/namecheap-mcp/).
