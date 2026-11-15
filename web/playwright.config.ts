import { defineConfig, devices } from '@playwright/test'
import { defineBddProject } from 'playwright-bdd'
import { existsSync } from 'node:fs'
import { CAMERA_FILE, writeCameraVideo } from './tests/support/camera'

// The PHP server runs in this time zone; magic dates in the tests (%now0, %ymd, ...) must agree with it wherever the tests run.
process.env.TZ = 'America/New_York'

// The steps need the session cookie's name, which is in .env with the app's other settings.
try { process.loadEnvFile('.env') } catch {}
// Ports of the preview server and the legacy app. Concurrent local test slots each set their own (E2E_PORT, E2E_PWA_PORT in .env).
const PORT = process.env.E2E_PORT ?? '4173'
const PWA = process.env.E2E_PWA_PORT ?? '3000'

// The BDD browser has a fake camera that plays this file (a step rewrites it to show a QR code; see camera.ts).
if (!existsSync(CAMERA_FILE)) writeCameraVideo('')
const fakeCamera = ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', `--use-file-for-fake-video-capture=${CAMERA_FILE}`]

// Always called, so `bddgen` finds its config even when the project is skipped.
const bddProject = defineBddProject({
  name: 'bdd',
  features: 'tests/features/**/*.feature',
  steps: 'tests/steps/**/*.ts',
  matchKeywords: true // the same step text can mean setup/action after Given and When, and a check after Then
})

// E2E tests hit the running SvelteKit app in a real browser. We spin up
// `npm run preview` (production build) rather than dev, because that's
// what actually ships. Uses .env.test if present, otherwise falls back
// to whatever's in .env.
export default defineConfig({
  testDir: './tests/e2e',
  expect: { timeout: 10_000 }, // pages hop between two dev servers and the PHP test server; 5 seconds is sometimes not enough
  fullyParallel: false, // rate-limiter uses in-memory state; parallel tests trip each other
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  workers: 1, // fullyParallel:false alone still runs spec *files* in parallel
  projects: [
    // Legacy plain-Playwright specs. Being replaced gradually by the Gherkin (bdd) project below.
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    // Skipped in CI: the testDb fixture needs the PHP test endpoint (local WAMP), which CI lacks.
    // Uses localhost, not 127.0.0.1: a signed-in flow needs the SSO cookie, whose domain (derived from PUBLIC_PHP_BASE_URL) is 'localhost' locally.
    ...(process.env.CI ? [] : [{ ...bddProject, use: { ...devices['Desktop Chrome'], baseURL: process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`, launchOptions: { args: fakeCamera } } }])
  ],
  webServer: [{
    // Build is run as a separate CI step so failures surface visibly;
    // locally, the `&&` fallback keeps the test:e2e flow one-command.
    command: process.env.CI
      ? `npm run preview -- --host 127.0.0.1 --port ${PORT}`
      : `npm run build && NODE_ENV=test npm run preview -- --host 127.0.0.1 --port ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    // The BDD sign-in scenarios exceed the login limit of 5 attempts per minute. The limiter ignores
    // E2E_RATE_LIMIT_MAX in production, and vite preview defaults NODE_ENV to production, hence NODE_ENV=test.
    env: {
      E2E_RATE_LIMIT_MAX: '1000',
      E2E_FAKE_USER: '1',
      CGPAY_PWA_URL: `http://localhost:${PWA}`
    },
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe'
  },
  // The legacy app, which the dashboard hands off to (port 3000), pointed at the local PHP. Local only: CI skips the BDD project.
  ...(process.env.CI ? [] : [{
    command: `npm run dev -- --port ${PWA}`,
    cwd: '..',
    url: `http://localhost:${PWA}`,
    reuseExistingServer: true,
    env: { VITE_TEST_API_URL: 'http://localhost/cg/cgmembers/api/' },
    timeout: 120_000,
    stdout: 'pipe' as const,
    stderr: 'pipe' as const
  }])]
})
