// Build-time git info, injected by vite's `define` (see vite.config.js).
// Rendered in the app footer so anyone looking at test/dev/staging/etc. can tell
// which branch + commit is currently deployed - answers William's Aug 2026 ask
// ("hard to know what is currently deployed on test. and pay-test.").

export type AppVersion = {
  branch: string
  sha: string
  builtAt: string // ISO timestamp
}

declare const __APP_VERSION__: AppVersion

// Wrap the injected constant in a getter so unit-test environments (where
// __APP_VERSION__ isn't defined by vite) don't blow up at import time.
export const appVersion: AppVersion =
  typeof __APP_VERSION__ !== 'undefined'
    ? __APP_VERSION__
    : { branch: 'unknown', sha: 'unknown', builtAt: '' }
