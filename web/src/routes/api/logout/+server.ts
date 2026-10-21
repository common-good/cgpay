// Sign out: clear the PHP SSO cookie so the browser stops presenting it.
// Once the cookie is gone, /cgpay/whoami returns 401 on the next SSR and
// +layout.server.ts sees `user: null` -> header renders as anonymous.

import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { env } from '$env/dynamic/private'
import { phpCookieDomain, phpHostname } from '$lib/server/env'

export const POST: RequestHandler = async ({ cookies }) => {
  // Startup validation guarantees PHP_SSO_COOKIE_NAME is set.
  const cookieName = env.PHP_SSO_COOKIE_NAME as string
  const parentDomain = phpCookieDomain()
  const phpHost = phpHostname()

  // Clear both scopes we set at login time (see /api/login): the parent
  // domain and the PHP host itself, mirroring how it was written.
  cookies.delete(cookieName, { path: '/', domain: parentDomain })
  if (phpHost !== parentDomain.replace(/^\./, '')) {
    cookies.delete(cookieName, { path: '/', domain: '.' + phpHost })
  }

  return json({ ok: true })
}
