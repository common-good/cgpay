# cgpay - Common Good SvelteKit app

The modernized member-facing app for Common Good. Runs behind pm2 alongside the PHP `cgmembers-frame` site; the two share a browser session and coordinate via server-to-server internal endpoints.

## What this repo is

- **`web/`** - the current SvelteKit + adapter-node app. All active engineering happens here.
- **top-level `src/`, `public/`, `dist/`, `vite.config.js`, `constants.js`, `utils0.js`** - legacy PWA (last touched Jan 2025 apart from one 2026-05 circular-import fix). Do not add new code here; do not delete without asking William - it still ships in some capacity.
- **`config/deploy.rb`, `config/deploy/*.rb`, `Capfile`, `Gemfile`** - Capistrano deploy config for the SvelteKit app (see Deploy below).

## Tech stack

- SvelteKit 2 with Svelte 5 runes (`$state`, `$derived`, `$props`, `$effect`)
- TypeScript throughout (`web/src/**/*.ts`, `<script lang="ts">`)
- Node 20+ via `@sveltejs/adapter-node`, run under pm2
- MySQL 5.7+ (shared read-only user against the cgmembers DB - see `web/src/lib/server/db.ts`)
- Vitest for unit tests, Playwright for E2E
- Capistrano (Ruby) for deploys

## Directory map (`web/src/`)

```
routes/
  +layout.svelte           app-wide navigation, header
  +layout.server.ts        SSR identity load - calls PHP /cgpay/whoami on every nav
  +page.svelte             dashboard
  login/                   sign-in page
  grants/                  fiscal-sponsorship grant intake + list
  api/                     server endpoints (JSON)
    login/                 POST /api/login - verifies password, hands off to PHP SSO
    logout/                POST /api/logout - clears the PHP session cookie
    me/                    /api/me/info, /api/me/balance
    grants/                grants CRUD (proxies to PHP)
    people-autocomplete/   grantor typeahead (proxies to PHP)
  preview/                 design previews for review (isolated from real auth)
lib/
  server/                  server-only code
    db.ts                  MySQL pool (READ-ONLY user - most reads work directly; writes go via PHP)
    drupal-password.ts     verifies $S$-prefixed Drupal 7 hashes
    auth.ts                cookie auth: reads the SSO cookie and asks PHP who owns it (currentUser, requireUser)
    php-whoami.ts          server-to-server client for /cgpay/whoami
    php-grants.ts          server-to-server client for /cgpay/grants
    php-people.ts          server-to-server client for /cgpay/people-autocomplete
    drive.ts               Google Drive upload for grant agreement PDFs
    rate-limit.ts          in-memory rate limiter for auth endpoints
  components/              shared Svelte components (Brand, etc.)
  assets/                  static assets bundled at build time
```

## Auth model

**PHP is the single source of truth for identity.** The two apps share a session via the `SSESS...` cookie scoped to `.commongood.earth` (derived from `PUBLIC_PHP_BASE_URL`; see `lib/server/env.ts`).

- **Login flow:** `/api/login` verifies password against `users.pass` (via `drupal-password.ts`), calls PHP `/cgpay/sso` to create a session, sets the SSO cookie on the browser scoped to both the parent domain and the PHP host.
- **Identity on every request:** `+layout.server.ts` reads the SSO cookie and calls PHP `/cgpay/whoami` to get `{uid, name, sponsored, menu}`. This runs on every full page load (SSR), but client-side navigation reuses the cached layout data unless something invalidates it (see Common gotchas), so a PHP account switch shows up on the next full load.
- **Sign out:** `/api/logout` clears the SSO cookie on both domain scopes.

**No JWT:** endpoints authenticate with the SSO cookie. Use `requireUser(cookies)` (401 when signed out) or `currentUser(cookies)` (null when signed out) from `lib/server/auth.ts`.

**Do not extend node-side password checking.** `drupal-password.ts` verifies only `$S$`-prefixed hashes, because that's all cgmembers uses (per William, 2026-07-06). For any other `pass` format `checkPassword` returns false - intentional, fail-closed. Do not add other Drupal hash formats.

Known gap: `/api/login` verifies the password in node, then `/cgpay-sso` creates the PHP session after checking only that the account is `ok`. So PHP's MFA step and its DB-backed flood control are bypassed (node's rate limiter is in memory and resets on restart). The intended fix is a PHP endpoint that verifies the password and returns a session or "MFA required", leaving node a thin proxy. Once PHP no longer owns login, node should use a modern hash (argon2 or bcrypt, rehashed on login) rather than a port of Drupal's scheme.

## Working with the PHP side

Server-to-server endpoints on cgmembers-frame (all POST, all use `X-CG-Internal-Token: <PHP_SSO_SECRET>`):

| Endpoint | Purpose | Client wrapper |
|---|---|---|
| `/cgpay/sso` | create session for verified uid | inlined in `api/login/+server.ts` |
| `/cgpay/lookup` | identifier -> uid resolution | inlined in `api/login/+server.ts` |
| `/cgpay/whoami` | session -> `{uid, name, sponsored, menu}` | `lib/server/php-whoami.ts` |
| `/cgpay/grants` | create/update grant record | `lib/server/php-grants.ts` |
| `/cgpay/people-autocomplete` | grantor typeahead | `lib/server/php-people.ts` |

When adding a new PHP endpoint: implement the PHP side under `cgmembers/rcredits/forms/cgpay*.inc` and register in `cg-menu.inc`, then add the node client under `web/src/lib/server/php-*.ts`. Use `hash_equals` in PHP for the shared-secret compare (fail-closed on empty).

## Env vars

Set per environment in `.env` on the deploy target (see [PR #155](https://github.com/common-good/cgpay/pull/155) - loaded via `node --env-file`):

- `PORT` - pm2 port (per environment, e.g. 3001 for test)
- `DB_HOST` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` - MySQL (read-only user)
- `PHP_SSO_SECRET` - shared secret with PHP (matches `cgpaySsoSecret` in cgmembers config.json)
- `PHP_SSO_COOKIE_NAME` - the `SSESS...` cookie name PHP sets
- `PUBLIC_PHP_BASE_URL` - PHP host base URL (exposed to browser). The `/cgpay-sso` and `/cgpay-grants` URLs and the parent cookie domain (e.g. `.commongood.earth`) are derived from it

## Branch / deploy flow

- Feature branches -> PR into `develop` (default base)
- `develop` -> deployed to `test` and other pre-prod stages via Capistrano
- Never push directly to `develop`, never target `main` for feature work
- Deploys happen from the top-level repo (not `web/`): `cap test deploy` (also `dev`, `staging`, `demo`, `beta`, `main`)
- Ruby 4.0+ needed for Capistrano bundler (system Ruby 2.6 doesn't work - use `/usr/local/Cellar/ruby/4.0.3/bin/ruby`)

## Testing

- `cd web && npm run check` - `svelte-check` type check
- `cd web && npm run test:unit` - Vitest unit tests
- `cd web && npm run test:e2e` - Playwright E2E: runs `bddgen` (compiles Gherkin features), then the plain specs and the Gherkin features. Builds and previews the app itself.
- `cd web && npm run build` - production build (verifies adapter-node output)
- Test accounts (non-production PHP side): the standard accounts Abe One, Bea Two, Citre, ... Ida Nine (`.ZPA` ... `.ZPI`), made by `makeTestAccounts()` in cgmembers-frame `admin/admin.inc`. The individual ones have password `k`; the companies (Citre, Gisette) have none. Abe is an administrator. Bea manages Citre (Abe sells for it). Gisette is a fiscally sponsored company, managed by Flo.

Always run at least `svelte-check` + `npm run build` before opening a PR.

### E2E: write new tests as Gherkin features

Plain specs (`web/tests/e2e/`) are being replaced gradually by Gherkin features (`web/tests/features/`, steps in `web/tests/steps/`) run with `playwright-bdd`. Layout, commands, and test-endpoint setup are in `web/tests/README.md`. The essentials:

- Import `Given`/`When`/`Then` from `tests/steps/fixtures.ts`, not from `@playwright/test`. Run `npm run bddgen` after editing a feature or step.
- One worker only (shared test DB, in-memory rate limiter). Scenarios must be independent: set up state in fixtures, never rely on a previous scenario.
- The Gherkin project is skipped in CI: its `testDb` fixture needs the PHP test endpoint (`testops()` in cgmembers-frame `forms/api.inc`, which refuses to run on production or stage).
- Scenarios refer to the standard test accounts by first name (Abe, Bea, Cit, ...). These are the PHP accounts `.ZPA`, `.ZPB`, ... (`NEWZPA`...; the same accounts as the legacy app's `K6...` ids). cgmembers-frame's own features use other uids (`.ZZA`...); in cgpay features always use the names.
- Write a BDD feature test for every new feature, and for existing functionality you touch.
- Reuse existing steps as much as possible.
- Avoid steps that match literal text (`I see text "..."`). Refer to a marker for the text instead (a `data-testid`), so the wording can be tweaked without changing the test or its purpose.
- Test accounts: Bea is an individual account, Citre a company account, Dee a second individual account. Abe is an admin account, used only for admin actions. Gisette (managed by Flo) is the fiscally sponsored company; the other accounts, listed in `web/tests/support/accounts.ts`, are available if needed.
- Tests should often run from the beginning to the middle of a process, from the middle to the end (or both), rather than start to finish every time. That clarifies the data structure strategy and reduces the number and complexity of tests needed.
- Group scenarios under the business rule they illustrate with Gherkin's `Rule:` keyword.
- The legacy PWA's cucumber suite (top-level `tests/`, `npm test` at the repo root) is the model for step vocabulary.

## Conventions

- **No em-dashes** (`-`) anywhere in code, PRs, commit messages, or comments (per Chris's preference).
- **Commit messages: title only, no body.** Details go in PR descriptions.
- **No `Co-Authored-By: Claude` trailers** on commits.
- **Comments:** default to none. Only add for non-obvious *why* - a hidden constraint, a subtle invariant, a workaround. Never explain *what* the code does. Exception, function headers: short functions get none; longer ones get a header that says informally what the function does and what it is good for.
- **Code style:** keep code as short as possible without losing clarity and minimize non-blank lines (avoid visual clutter). Prefer conventional short names (`k` key, `v` value, `i` index, `a` account, `tx` transaction, `q` query) to long ones. Match the surrounding file.
- **New endpoints:** return `throw error(status, msg)` for failures, `return json(...)` for successes. Never leak internal errors to the client.
- **Server-only imports:** anything reading env vars, calling DB, or calling PHP must live under `lib/server/` and be imported only from `+server.ts` / `+*.server.ts` files.
- **Preview routes** under `routes/preview/` are for design review only - they use isolated data and must not depend on real auth.

## Common gotchas

- **PWA-era files at repo root** (`src/`, `constants.js`, `vite.config.js`) - do not confuse for the SvelteKit app. All new work goes in `web/`.
- **`u_company` table lacks SELECT for `cgweb_ro`** in some environments - `/api/me/info` has a defensive fallback that treats `sponsored=false` when the query denies (see [PR #151](https://github.com/common-good/cgpay/pull/151)).
- **Cookie double-write in login:** we set the SSO cookie under both `.commongood.earth` AND `.<phphost>` because stale host-scoped cookies from prior direct-PHP logins can shadow the parent-domain one. Don't remove either without testing.
- **`+layout.server.ts` load does NOT rerun when cookies change.** SvelteKit doesn't track `cookies.get()` as a dependency; a server load reruns only on URL/param changes it uses, `depends()` keys, or an explicit `invalidate`/`invalidateAll`. So anything that sets or clears the SSO cookie client-side must then navigate with `goto(path, { invalidateAll: true })` (login) or call `invalidateAll()` (sign out), or the header keeps showing the old user.

## Cross-repo

Companion repo: `cgmembers-frame` (Drupal-7-derived PHP - member site, admin, tx engine). See its `CLAUDE.md` for the PHP-side conventions.

### Local setup (varies by developer; clone the repos wherever suits you)

- **Windows:** keep cgpay in WSL and run node/npm there (e.g. `wsl bash -ic "..."`). Keep cgmembers-frame on the Windows filesystem under WAMP, so the PHP side is reachable at a local URL such as `http://localhost/<folder>/cgmembers`. Files edited from Windows tools can end up with CRLF line endings in the WSL checkout; check diffs with WSL git.
- **Mac:** TODO (Chris or another Mac developer): document how to run the PHP side locally and where the repos live.
- Run the dev server from `web/` (`cd web && npm run dev`). Running it from the repo root starts the legacy PWA.

## People

- **Jose** - CEO, product owner
- **William Spademan** - founder, outgoing tech lead (still active on the PHP side)
- **Chris Schwab** - incoming lead engineer
