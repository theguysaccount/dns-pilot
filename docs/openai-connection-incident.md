# DNS Pilot published connection incident — October 8, 2026

## Current outcome

Version 0.2.2 is approved and published. This does not establish successful installation: ChatGPT loads the listing but cannot load the included app connection. A page refresh did not repair it. The listing displays the correct name, DNS Pilot; its Apps section instead displays the internal app ID and No description. The connection dialog uses that same internal ID and says it could not load this app’s connection details. Open in browser returns to the same listing/dialog rather than completing a connection.

The publisher MCP panel reports Configured, Authorized, Domain verified, six tools Live, and no issues in its latest scan. Its Connect account and Rescan controls are disabled. The supported UI exposes no app-name or app-record repair control in this published state. The official plugin-management dependency lookup also returned plugin_not_found for both the exact public plugin ID and DNS Pilot. These observations point to a missing or unavailable OpenAI app-directory/connection record; they do not prove the underlying internal cause or that eventual publication propagation will resolve it.

## Fresh service checks

Public OAuth discovery and health return HTTP 200. Direct deployed OAuth PKCE, six-tool discovery, five positive cases, three negative mechanisms, sample apply/readback/reconciliation, mail preservation, and Cloudflare/Google public DNS checks passed. The first run failed at refresh; a follow-up run passed refresh as well. Error reporting in the verification script now includes only HTTP status and OAuth error code, never credentials or tokens. No real Namecheap account or live customer DNS was accessed.

Live Namecheap callback approval remains pending. Correcting the OpenAI connection record does not enable real Namecheap access.

## Support report sent

Subject: Published DNS Pilot 0.2.2 cannot install: missing app connection metadata and internal ID shown as name

Hello OpenAI support,

DNS Pilot 0.2.2 was approved and published under the verified Personal organization on October 8. The public listing loads, but installation fails before the hosted OAuth page opens.

Public listing: https://chatgpt.com/plugins/plugin_asdk_app_6ac079ad82f88191ade560b44f32ef12
Publisher dashboard: https://platform.openai.com/plugins/manage/plugin_asdk_app_6ac079ad82f88191ade560b44f32ef12
Included app: asdk_app_6ac079ad82f88191ade560b44f32ef12
Published release: pluginrel_ebdfe46c49348191abcc5be133297df6
Server: https://dns-pilot.cuelayer.workers.dev/mcp
Expected user-facing name: DNS Pilot

Reproduction: open the public listing, click Install plugin, and observe the connection dialog. Its title is Connect followed by the internal app ID, and it reports Could not load this app’s connection details. Continue in browser. Open in browser returns to the same page and loop. The listing’s Apps section also shows the internal ID with No description. A fresh page reload did not resolve the issue.

The publisher MCP panel reports Configured, Authorized, Domain verified, all six tools Live, and no issues. Direct endpoint OAuth PKCE, refresh, tool discovery, and sample/public DNS operations pass. The installed-app dependency connector cannot resolve the published plugin by ID or display name.

Please check publication/materialization of this included app’s directory and connection configuration, restore an installable OAuth connection, and expose DNS Pilot as its name. Please preserve the published plugin URL and release. The current published metadata explicitly discloses that real Namecheap connections remain unavailable pending provider approval; the reported issue occurs before any provider authorization.

Thank you.

## Delivery

Jack explicitly authorized sending the prepared report and screenshot. On October 8, the report was sent in a new authenticated OpenAI Help Center support conversation, with artifacts/openai-connection-loop-2026-10-08.png attached. The sent report appears as You said in the conversation, and AI-assisted support replied. The reply suggested refreshing/reinstalling and asked about incognito and a second tester; those latter checks have not been performed. A follow-up was sent explaining that installation fails before an installed entry exists, requesting a technical case, the case number, and an actual referral to the team responsible for published app directory/connection configuration. No credentials, access tokens, or reviewer passwords were sent. The support UI offered escalation; it was confirmed and then displayed Escalation requested and Escalated to a support specialist, with replies also sent by email and a response expected in the coming days. No case number was shown. Repair is not confirmed. Private proof is saved in artifacts/openai-support-sent-2026-10-08.jpg.
