// Startup env-var validation. Runs once when SvelteKit's server starts (every
// request thereafter reuses this module). If anything required is missing we
// log the full list and throw so the process never serves traffic with a
// half-configured handoff - previously that silently produced "login looks
// successful, then every page is signed out" with nothing in the logs.
//
// See cgpay #178.

import type { Handle } from '@sveltejs/kit'
import { assertRequiredEnv } from '$lib/server/env'
import { healSsoCookies } from '$lib/server/sso-cookies'
import { phpWhoami } from '$lib/server/php-whoami'

try {
  assertRequiredEnv()
} catch (e) {
  console.error('[startup]', e instanceof Error ? e.message : e)
  throw e
}

// A browser that sends the session cookie twice (an old scope left behind) is healed before anything reads it.
export const handle: Handle = async ({ event, resolve }) => {
  await healSsoCookies(event.cookies, event.request.headers.get('cookie'), async v => (await phpWhoami(v)).ok)
  return resolve(event)
}
