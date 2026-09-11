// Sign out: clear the PHP SSO cookie so the browser stops presenting it.
// Once the cookie is gone, /cgpay-whoami returns 401 on the next SSR and
// +layout.server.ts sees `user: null` -> header renders as anonymous.

import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { env } from '$env/dynamic/private'

export const POST: RequestHandler = async ({ cookies }) => {
  const cookieName = env.PHP_SSO_COOKIE_NAME
  const cookieDomain = env.PHP_COOKIE_DOMAIN
  if (cookieName) {
    // Clear both scopes we set at login time (see /api/login): the parent
    // domain and the PHP host itself, mirroring how it was written.
    cookies.delete(cookieName, { path: '/', domain: cookieDomain || undefined })
    try {
      const phpHost = new URL(env.PHP_SSO_URL ?? '').hostname
      if (phpHost && phpHost !== cookieDomain?.replace(/^\./, '')) {
        cookies.delete(cookieName, { path: '/', domain: '.' + phpHost })
      }
    } catch { /* PHP_SSO_URL missing/malformed - nothing more to clear */ }
  }
  return json({ ok: true })
}
