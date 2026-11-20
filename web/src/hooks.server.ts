// Startup env-var validation. Runs once when SvelteKit's server starts (every
// request thereafter reuses this module). If anything required is missing we
// log the full list and throw so the process never serves traffic with a
// half-configured handoff - previously that silently produced "login looks
// successful, then every page is signed out" with nothing in the logs.
//
// See cgpay #178.

import type { Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { assertRequiredEnv, phpCookieDomain } from '$lib/server/env'
import { healSsoCookies } from '$lib/server/sso-cookies'
import { phpWhoami } from '$lib/server/php-whoami'
import { handleQrAttribution } from '$lib/server/qr-attribution'

try {
  assertRequiredEnv()
} catch (e) {
  console.error('[startup]', e instanceof Error ? e.message : e)
  throw e
}

// Catch cg4.us attribution redirects (pay.commongood.earth/a=..., /w=..., /q=...)
// before SvelteKit's route table: the a/w/q request is not a real page, just a
// marker. We stamp the `ad` cookie on the PHP host's cookie domain (same scope
// as the SSO cookie, so .members.commongood.earth in production) and bounce
// the visitor to the real destination. Only the members/pay side reads this
// cookie (cgmembers-frame's legacy forms + cgpay's /api/signup); WordPress
// neither sets nor reads it, so the apex scope is unnecessary. Runs before
// the SSO healer because a matched attribution request short-circuits with a
// 302 and never touches an app route, so there is nothing to heal.
const qrAttribution: Handle = async ({ event, resolve }) => {
  const redirect = handleQrAttribution(
    event.url,
    event.cookies.get('ad'),
    phpCookieDomain(),
  )
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
