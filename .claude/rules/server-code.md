---
paths:
  - "web/src/lib/server/**"
  - "web/src/routes/**/+server.ts"
  - "web/src/routes/**/+*.server.ts"
---

- Anything reading env vars, calling the DB, or calling PHP lives under `lib/server/` and is imported only from `+server.ts` / `+*.server.ts` files.
- Endpoints: `throw error(status, msg)` for failures, `return json(...)` for successes. Never leak internal errors to the client.
- A new PHP endpoint: load the `cgpay-php-endpoint` skill.
- Writes to the DB go only through the `data.ts` allowlist; everything else goes via PHP.
