# Provider request — prepared, not sent

Subject: Register a third-party OAuth client for DNS Pilot

We are building DNS Pilot, an independent DNS-only integration that connects Namecheap accounts to AI assistants. We use your official MCP for domain listing and DNS record get/save/delete, without exposing purchasing, billing, contact editing, or nameserver migration tools.

Our controlled origin is https://dns-pilot.cuelayer.workers.dev and our requested OAuth callback is https://dns-pilot.cuelayer.workers.dev/callback. We need authorization-code flow with S256 PKCE and refresh tokens for the advertised Namecheap MCP resource.

The dynamic registration endpoint returned a client ID but its `redirect_uris` did not contain our requested callback. A real authorization request to that callback was rejected. Does Namecheap support a separately registered third-party hosted application for this use case? If so, please provide the registration process and any required review or terms, and approve our exact callback for a dedicated client.

Source: https://github.com/theguysaccount/dns-pilot
Privacy: https://dns-pilot.cuelayer.workers.dev/privacy
Support: https://dns-pilot.cuelayer.workers.dev/support

We have kept hosted connections and writes disabled pending approval. We do not want to reuse another application's redirect URI or bypass provider restrictions.
