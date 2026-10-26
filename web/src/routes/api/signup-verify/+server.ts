// POST /api/signup-verify - proxies the verify-code + set-password step to
// PHP /cgpay-signup-verify. On success PHP returns SSO cookie values with the
// same shape as /cgpay-sso; we forward them to the browser the same way
// /api/login does so the member lands signed in on both the node app and the
// PHP site.

import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { env } from '$env/dynamic/private'
import { phpUrl } from '$lib/utils'
import { phpCookieDomain, phpHostname } from '$lib/server/env'

type VerifyBody = {
  uid?: unknown
  code?: unknown
  newPassword?: unknown
}

type SsoLike = {
  uid: number
  qid: string
  cookieName: string
  sid: string
  ssid: string
  boxCookieName?: string
  boxCookieValue?: string
  menu?: string[]
}

export const POST: RequestHandler = async ({ request, cookies }) => {
  let body: VerifyBody
  try {
    body = await request.json()
  } catch {
    return error(400, 'Invalid JSON body')
  }

  const uid = typeof body.uid === 'number' ? body.uid : 0
  const code = typeof body.code === 'string' ? body.code.trim() : ''
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''

  if (!uid || !code || !newPassword) {
    return json({ message: 'uid, code, and newPassword are required.' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return json({ errors: { newPassword: 'Password must be at least 8 characters.' } }, { status: 400 })
  }

  const secret = env.PHP_SSO_SECRET
  if (!secret) {
    console.error('[signup-verify] PHP_SSO_SECRET not configured')
    return error(502, 'Signup is temporarily unavailable - please try again later.')
  }

  let res: Response
  try {
    res = await fetch(phpUrl('cgpay-signup-verify'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-cg-internal-token': secret
      },
      body: JSON.stringify({ uid, code, newPassword })
    })
  } catch (e) {
    console.error('[signup-verify] PHP network error:', e)
    return error(502, 'Unable to reach the signup service - please try again.')
  }

  const text = await res.text()
  let data: unknown = null
  try { data = text ? JSON.parse(text) : null } catch { /* non-JSON PHP response */ }

  if (!res.ok) {
    if (data && typeof data === 'object' && 'errors' in data) {
      return json(data, { status: 400 })
    }
    console.error(`[signup-verify] PHP /cgpay-signup-verify returned ${res.status}: ${text.slice(0, 300)}`)
    return error(502, 'Verification failed - please try again.')
  }

  if (!data || typeof data !== 'object'
      || typeof (data as SsoLike).cookieName !== 'string'
      || typeof (data as SsoLike).ssid !== 'string') {
    console.error('[signup-verify] PHP returned unexpected body:', text.slice(0, 300))
    return error(502, 'Verification failed - please try again.')
  }

  const sso = data as SsoLike

  // Mirror the cookie-set pattern from /api/login: SSO cookie on the shared
  // parent domain + a second copy scoped to the PHP host subdomain to overwrite
  // any stale cookie there, plus the device-tracking box-<QID> cookie.
  const cookieOpts = {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const
  }
  const parentDomain = phpCookieDomain()
  const phpHost = phpHostname()

  cookies.set(sso.cookieName, sso.ssid, { ...cookieOpts, domain: parentDomain })
  if (phpHost !== parentDomain.replace(/^\./, '')) {
    cookies.set(sso.cookieName, sso.ssid, { ...cookieOpts, domain: '.' + phpHost })
  }
  if (sso.boxCookieName && sso.boxCookieValue) {
    cookies.set(sso.boxCookieName, sso.boxCookieValue, { ...cookieOpts, domain: parentDomain })
  }

  return json({
    uid: sso.uid,
    qid: sso.qid,
    menu: sso.menu ?? ['Dashboard', 'History', 'Community', 'Settings']
  })
}
