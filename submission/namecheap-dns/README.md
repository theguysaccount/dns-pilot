# DNS Pilot for Namecheap — hosted beta

This directory draft connects to https://dns-pilot.cuelayer.workers.dev/mcp using OAuth. It requires no local executable.

The dedicated reviewer sandbox runs the real planner, persistence and reconciliation workflow against synthetic example.com records. It cannot access Namecheap or change public DNS. Public DNS lookups query real resolvers. Real Namecheap account connections await provider callback approval, and live DNS writes remain disabled.

The package includes five positive and three negative review cases plus a captioned recording of the deployed tools. Private credentials are supplied only through the OpenAI review dashboard. Developer identity and domain ownership are verified. Final review submission and approval are separate portal states; see the repository release status for the latest result.
