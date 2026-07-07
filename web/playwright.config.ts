import { defineConfig, devices } from '@playwright/test'

// E2E tests hit the running SvelteKit app in a real browser. We spin up
// `npm run preview` (production build) rather than dev, because that's
// what actually ships. Uses .env.test if present, otherwise falls back
// to whatever's in .env.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // rate-limiter uses in-memory state; parallel tests trip each other
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    // Build is run as a separate CI step so failures surface visibly;
    // locally, the `&&` fallback keeps the test:e2e flow one-command.
    command: process.env.CI
      ? 'npm run preview -- --host 127.0.0.1 --port 4173'
      : 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe'
  }
})
