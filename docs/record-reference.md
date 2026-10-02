# Namecheap MCP record reference

Verified against the [provider reference](https://www.namecheap.com/support/knowledgebase/article.aspx/10824/34/namecheap-mcp/) on October 1, 2026 (America/New_York).

Every record has `type`, relative `name` (`@` for apex), and optional `ttl` of 60–3600 seconds on save. Do not copy the legacy XML API TTL range into MCP. `group` is read-only ownership metadata.

| Type | Value fields |
| --- | --- |
| A / AAAA | `address` |
| CNAME | `cname` |
| ALIAS | `aliasName` |
| MX | `exchange`, `preference` |
| TXT | `value` (case-sensitive, whitespace preserved) |
| NS / PTR | `nameserver` / `pointer` |
| CAA | `flag`, `tag`, `value` |
| SRV | `service`, `protocol`, `priority`, `weight`, `port`, `target` |
| TLSA | `usage`, `selector`, `matching`, `port`, `protocol`, `associationData` |
| HTTPS / SVCB | `svcPriority`, `targetName`, optional `port`, `scheme`, `svcParams` |

`dns_records_save` adds a record or updates its TTL; it does not replace a value at the same name/type. Value replacement requires exact delete then save and may have a temporary gap. TTL-only replacement uses one save. Delete takes matching fields without TTL. Keep `force: false`.

Host-like values may return with trailing dots; CAA values may be quoted. The planner canonicalizes those for comparison. TXT values remain byte-sensitive. URL, URL301, FRAME and some malformed exotic values are omitted from the typed contract; inspect them in the dashboard. Product-managed records are not editable custom records.
