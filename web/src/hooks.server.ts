// Startup env-var validation. Runs once when SvelteKit's server starts (every
// request thereafter reuses this module). If anything required is missing we
// log the full list and throw so the process never serves traffic with a
// half-configured handoff - previously that silently produced "login looks
// successful, then every page is signed out" with nothing in the logs.
//
// See cgpay #178.

import type { Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { assertRequiredEnv } from '$lib/server/env'
import { healSsoCookies } from '$lib/server/sso-cookies'
import { phpWhoami } from '$lib/server/php-whoami'
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
// visitor to the real destination. This cookie's scope is DIFFERENT from the
// SSO cookie (per-host since #209) because attribution is cross-site by design,
// while identity is per-env on purpose. Runs before the SSO healer because a
// matched attribution request short-circuits with a 302 and never touches an
// app route, so there is nothing to heal.
const qrAttribution: Handle = async ({ event, resolve }) => {
  const redirect = handleQrAttribution(event.url, event.cookies.get('ad'), apexCookieDomain(event.url.hostname))
  if (redirect) {
    return new Response(null, { status: 302, headers: redirect.headers })
  }
  return resolve(event)
}

// A browser that sends the session cookie twice (an old scope left behind) is healed before anything reads it.
const ssoHealer: Handle = async ({ event, resolve }) => {
  await healSsoCookies(event.cookies, event.request.headers.get('cookie'), async v => (await phpWhoami(v)).ok)
  return resolve(event)
}

export const handle = sequence(qrAttribution, ssoHealer)
