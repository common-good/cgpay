# cgpay/web

SvelteKit subapp that proves out the Node + Svelte + MariaDB + JWT stack against the
existing Drupal `users` table. First milestone of the broader PHP → Svelte migration.

## What's here

| Path | What |
|---|---|
| `src/routes/api/login/+server.ts` | `POST /api/login` — validates against `users.pass` (Drupal phpass), issues a JWT. Rate-limited; timing-constant. |
| `src/routes/api/me/balance/+server.ts` | `GET /api/me/balance` — bearer-auth, returns `users.balance`. |
| `src/routes/login/+page.svelte` | Login form. |
| `src/routes/+page.svelte` | Dashboard: shows balance, redirects to `/login` if no token. |
| `src/lib/server/drupal-password.ts` | Port of `cgmembers/includes/password.inc` — handles `$S$`, `$P$`, `$H$`, `U$` prefixes. |
| `src/lib/server/db.ts` | `mysql2/promise` connection pool, env-driven. |
| `src/lib/server/auth.ts` | JWT sign/verify; refuses to boot without a 32+ char `JWT_SECRET`. |
| `src/lib/server/rate-limit.ts` | Minimal in-memory rate limiter (move to Redis before multi-instance). |
| `src/routes/preview/...` | UI-only design previews. Use placeholder data; no auth required. |

## Quick start (local dev with mock data)

```sh
cp .env.example .env
# fill in JWT_SECRET only (any string >= 32 chars is fine for browsing UI)
npm install
npm run dev
```

The preview routes (`/preview/*`) render with placeholder data — you can browse the whole
design without a database.

## Running end-to-end against staging

To actually log in and read a real balance, you need three things:

1. **Read-only DB user** on staging's MariaDB.
2. **A test member account** to log in as.
3. **JWT secret** for token signing.

### Step 1 — SSH tunnel to staging's MariaDB

The MariaDB port isn't open to the internet; connect via SSH tunnel:

```sh
# Forward localhost:3307 to staging's MariaDB
ssh -L 3307:127.0.0.1:3306 staging
# leave this terminal open
```

### Step 2 — Configure `.env`

```sh
cp .env.example .env
```

Fill in:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=<DB_NAME>_ro      # read-only user for now
DB_PASSWORD=…
DB_NAME=…                 # test, dev, staging, demo, beta, main, etc.
JWT_SECRET=$(openssl rand -base64 48)
```

### Step 3 — Run

```sh
npm run dev -- --open
```

Log in with the test member account; the dashboard should show their real balance.

## Verifying the Drupal phpass port against a real hash

If you have a real `$S$…` hash from `users.pass` and the plaintext password, you can
confirm our port works before wiring anything else:

```sh
npm run verify-phpass -- '$S$EXAMPLEHASH…' 'thepassword'
```

Exits 0 if the hash matches, 1 otherwise.

## Scripts

| Command | What |
|---|---|
| `npm run dev` | Vite dev server. |
| `npm run check` | TypeScript + Svelte check. |
| `npm run build` | Production build (adapter-node, self-contained Node server in `build/`). |
| `npm run preview` | Run the production build locally. |
| `npm run verify-phpass` | One-off Drupal phpass verifier (see above). |

## Deploying

The build uses `@sveltejs/adapter-node`, which produces a standalone Node server that
runs anywhere with `node build`. Two reasonable hosting paths:

### A. Co-locate on the existing demo VPS (recommended for staging)

```sh
npm run build
# Copy the build/ directory + node_modules + package.json to the VPS.
# On the VPS, with PORT and the required env vars set:
PORT=3000 node build
# Then put a reverse proxy (Nginx / Caddy) in front, e.g. app.demo.commongood.earth → :3000.
```

### B. Any Node host (Render, Fly, Railway, Vercel-with-node-build, etc.)

Just `npm run build`; entry point is `build/index.js`. Set the same env vars you'd use
locally (DB_* + JWT_SECRET).

### Endpoints currently exposed

| Method | Path | What | Status |
|---|---|---|---|
| `POST` | `/api/login` | Username + password → JWT | Phase 1 — production-ready |
| `GET`  | `/api/me/balance` | Balance for JWT subject | Phase 1 — production-ready |
| `GET`  | `/api/me/info` | Balance + recent transactions + pending invoices in one call | Phase 2 — queries match documented schema, awaiting verification against real data |

## Security notes

- All SQL is parameterized.
- Login is rate-limited (5 attempts / 60s rolling window per IP; 5-minute lockout after).
- Password verification is timing-constant (we always run the hash, even when the
  username doesn't exist, to avoid leaking which usernames are valid).
- `JWT_SECRET` must be at least 32 chars or the app refuses to start.
- `.env` is gitignored; commit `.env.example` only.

## Known gaps before production

- Rate limiter is in-memory — move to Redis or use a shared cache before scaling out.
- No refresh tokens; JWT expires after 8h and the user re-logs in.
- No CSRF; the API expects a bearer token in `Authorization`, not a cookie.
- `users.balance` is read as a JS Number (precise up to 2^53). Switch to a Decimal type
  on the wire if balances ever exceed that.
