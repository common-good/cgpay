// Sign out: clear the PHP SSO cookie so the browser stops presenting it.
// Once the cookie is gone, /cgpay/whoami returns 401 on the next SSR and
// +layout.server.ts sees `user: null` -> header renders as anonymous.

import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { env } from '$env/dynamic/private'
import { phpCookieDomain } from '$lib/server/env'

export const POST: RequestHandler = async ({ cookies }) => {
  // Startup validation guarantees PHP_SSO_COOKIE_NAME is set.
  const cookieName = env.PHP_SSO_COOKIE_NAME as string
  cookies.delete(cookieName, { path: '/', domain: phpCookieDomain() })
  return json({ ok: true })
}
