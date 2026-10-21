import { defineConfig } from 'vitest/config'

// The PHP server runs in this time zone; magic dates in the tests (%now0, %ymd, ...) must agree with it wherever the tests run.
process.env.TZ = 'America/New_York'

// Vitest runs unit tests only — pure functions and server-side modules that
// don't need a real browser. E2E tests live in tests/e2e and run via Playwright.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'tests/unit/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
    environment: 'node',
    globals: false
  }
})
