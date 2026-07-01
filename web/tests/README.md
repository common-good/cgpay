# Tests

Two harnesses, run separately:

- **Vitest** — pure-function and server-module unit tests. Fast, no browser, no DB.
- **Playwright** — end-to-end tests that spawn a real Chromium and hit the built app.

## Layout

```
tests/
├── unit/       # Vitest tests — run with `npm run test:unit`
│   ├── auth.test.ts               JWT sign/verify + bearer extraction
│   ├── drupal-password.test.ts    phpass prefix dispatch + guard behaviour
│   └── rate-limit.test.ts         Rolling window + lockout semantics
└── e2e/        # Playwright tests — run with `npm run test:e2e`
    └── login.spec.ts              Login page contract + protected-route redirect
```

## Running locally

```sh
# Unit tests — quick, run these constantly during development
npm run test:unit
npm run test:unit:watch

# E2E — slower (builds + starts the preview server)
npx playwright install chromium   # once, per machine
npm run test:e2e
npm run test:e2e:ui               # opens the Playwright UI

# Everything
npm run test
```

## What's covered vs. what isn't

The unit tests cover the pieces that don't touch external systems: JWT
round-trip, phpass prefix dispatch and input guards, rate-limit window/lockout
semantics. They run in <1s and are safe in CI without any env.

The E2E tests cover the login-page contract (labels, placeholder, error path)
and the protected-route redirect (unauthenticated visitor to `/` gets bounced to
`/login`). They do **not** cover the full sign-in round-trip because that needs
a real MariaDB with a known user row plus the PHP SSO backend — both awkward
to reproduce in CI. That path is smoke-tested manually against staging on
every deploy; when it makes sense, extend `login.spec.ts` with a
`test.describe.serial('signed-in flow')` guarded by an env flag pointing at a
throwaway test DB.

## CI

`.github/workflows/test.yml` runs both jobs on every PR that touches `web/**`.
Unit tests must pass. E2E has retries on failure and uploads the Playwright
report as an artifact so we can inspect flaky renders.
