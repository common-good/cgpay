---
name: cgpay-php-endpoint
description: Add or change a server-to-server PHP endpoint that the SvelteKit app calls (/cgpay/*), and its node client wrapper. Use when node needs something only PHP can do.
---

Server-to-server endpoints on cgmembers-frame (all POST, all use `X-CG-Internal-Token: <PHP_SSO_SECRET>`):

| Endpoint | Purpose | Client wrapper |
|---|---|---|
| `/cgpay/sso` | create session for verified uid | inlined in `api/login/+server.ts` |
| `/cgpay/lookup` | identifier -> uid resolution | inlined in `api/login/+server.ts` |
| `/cgpay/whoami` | session -> `{uid, name, sponsored, menu}` | `lib/server/php-whoami.ts` |
| `/cgpay/grants` | create/update grant record | `lib/server/php-grants.ts` |
| `/cgpay/people-autocomplete` | grantor typeahead | `lib/server/php-people.ts` |


Before adding one, check whether node can do it directly with a DB call (data.ts allowlist); PHP is for the hard parts.
