// Startup env-var validation. Runs once when SvelteKit's server starts (every
// request thereafter reuses this module). If anything required is missing we
// log the full list and throw so the process never serves traffic with a
// half-configured handoff - previously that silently produced "login looks
// successful, then every page is signed out" with nothing in the logs.
//
// See cgpay #178.

import type { Handle } from '@sveltejs/kit'
import { assertRequiredEnv } from '$lib/server/env'
import { handleQrAttribution, apexCookieDomain } from '$lib/server/qr-attribution'

try {
  assertRequiredEnv()
} catch (e) {
  console.error('[startup]', e instanceof Error ? e.message : e)
  throw e
}

// Catch cg4.us attribution redirects (pay.commongood.earth/a=..., /w=..., /q=...)
// before SvelteKit's route table: the a/w/q request is not a real page, just a
// marker. We stamp the `ad` cookie on `.commongood.earth` (apex, so both the
// pay app and the WordPress site at commongood.earth see it) and bounce the
// visitor to the real destination. Note this cookie's scope is DIFFERENT from
// the SSO cookie (per-host since #209) because attribution is cross-site by
// design, while identity is per-env on purpose.
export const handle: Handle = async ({ event, resolve }) => {
  const redirect = handleQrAttribution(event.url, event.cookies.get('ad'), apexCookieDomain(event.url.hostname))
  if (redirect) {
    return new Response(null, { status: 302, headers: redirect.headers })
  }
  return resolve(event)
}
