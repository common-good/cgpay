// Startup env-var validation. Runs once when SvelteKit's server starts (every
// request thereafter reuses this module). If anything required is missing we
// log the full list and throw so the process never serves traffic with a
// half-configured handoff - previously that silently produced "login looks
// successful, then every page is signed out" with nothing in the logs.
//
// See cgpay #178.

import { assertRequiredEnv } from '$lib/server/env'

try {
  assertRequiredEnv()
} catch (e) {
  console.error('[startup]', e instanceof Error ? e.message : e)
  throw e
}
