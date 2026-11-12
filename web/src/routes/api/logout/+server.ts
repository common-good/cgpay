// Sign out: clear the PHP SSO cookie so the browser stops presenting it.
// Once the cookie is gone, /cgpay/whoami returns 401 on the next SSR and
// +layout.server.ts sees `user: null` -> header renders as anonymous.

import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { clearSsoCookie } from '$lib/server/sso-cookies'

export const POST: RequestHandler = async ({ cookies }) => {
  clearSsoCookie(cookies)
  return json({ ok: true })
}
