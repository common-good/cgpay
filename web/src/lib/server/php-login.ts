// Server-to-server steps shared by every flow that ends in a signed-in browser (login, password reset):
// identifier -> uid (/cgpay/lookup), uid -> PHP session (/cgpay/sso), and the cookies that carry it.

import { error } from '@sveltejs/kit'
import type { Cookies } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'
import { phpUrl } from '$lib/utils'
import { phpCookieDomain, phpHostname } from '$lib/server/env'

// DEBUG_LOGIN=1 in .env enables tracing. Never log the password or shared secret, only presence/length.
export const DEBUG_LOGIN = env.DEBUG_LOGIN === '1'
export function dbg(...args: unknown[]) {
  if (DEBUG_LOGIN) console.log('[login:debug]', ...args)
}

export type SsoResponse = {
  cookieName: string
  sid: string
  ssid: string
  menu: string[]
  boxCookieName?: string
  boxCookieValue?: string
}

/**
 * Resolve a user-supplied identifier (account code, username, full name, email,
 * or phone) to a uid via the PHP /cgpay/lookup endpoint. cgmembers owns the
 * matching logic (including the encrypted-email path), so we don't reimplement
 * it here. Returns null if no match - caller still runs checkPassword against
 * DUMMY_HASH for timing parity.
 */
export async function phpLookup(identifier: string): Promise<number | null> {
  const secret = env.PHP_SSO_SECRET
  if (!secret) {
    dbg('lookup skipped: PHP_SSO_SECRET not set')
    return null
  }

  try {
    const url = phpUrl('cgpay/lookup')
    dbg('lookup request:', { url, body: { identifier }, tokenLength: secret.length })
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-cg-internal-token': secret
      },
      body: JSON.stringify({ identifier })
    })
    if (DEBUG_LOGIN) {
      const text = await res.clone().text().catch(() => '<unreadable>')
      dbg('lookup response:', res.status, text.slice(0, 500))
    }
    if (res.status === 404) return null
    if (!res.ok) {
      console.error(`[login] PHP lookup returned ${res.status}`)
      return null
    }
    const data = await res.json().catch(() => null)
    if (!data || typeof data.uid !== 'number') {
      dbg('lookup response missing numeric uid:', data)
      return null
    }
    return data.uid
  } catch (e) {
    console.error('[login] PHP lookup network error:', e)
    return null
  }
}

/**
 * Hand off the verified login to the PHP cgmembers site so menu links land
 * pre-authenticated. Returns the session cookie info + the user's menu
 * categories, or null if SSO is not configured (we degrade gracefully - login
 * still succeeds, but PHP links will require a second login).
 */
export async function phpSso(uid: number): Promise<SsoResponse | null> {
  const secret = env.PHP_SSO_SECRET
  if (!secret) {
    console.warn('[login] PHP_SSO_SECRET not configured - skipping PHP session handoff')
    return null
  }

  let res: Response
  try {
    const url = phpUrl('cgpay/sso')
    dbg('sso request:', { url, body: { uid }, tokenLength: secret.length })
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-cg-internal-token': secret
      },
      body: JSON.stringify({ uid })
    })
  } catch (e) {
    console.error('[login] PHP SSO network error:', e)
    throw error(502, 'Unable to complete sign-in - please try again.')
  }

  dbg('sso response status:', res.status)
  if (!res.ok) {
    console.error(`[login] PHP SSO returned ${res.status}`)
    throw error(502, 'Unable to complete sign-in - please try again.')
  }

  const data = await res.json().catch(() => null)
  if (!data || typeof data.cookieName !== 'string' || typeof data.ssid !== 'string') {
    console.error('[login] PHP SSO returned unexpected body:', data)
    throw error(502, 'Unable to complete sign-in - please try again.')
  }
  return data as SsoResponse
}

/** Put the PHP session (and device) cookies on the browser. See Common gotchas in the Guide before changing this. */
export function setSsoCookies(cookies: Cookies, sso: SsoResponse) {
  const cookieOpts = {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const
  }
  const parentDomain = phpCookieDomain()
  const phpHost = phpHostname()

  // Primary cookie: scoped to the shared parent domain so it reaches every
  // subdomain (including the PHP host).
  cookies.set(sso.cookieName, sso.ssid, {
    ...cookieOpts,
    domain: parentDomain
  })

  // Secondary cookie: scoped to the PHP host subdomain with the SAME value.
  // If the user ever signed in directly on that subdomain (e.g. demo) the
  // browser has a stale cookie scoped to it. Setting one with matching
  // name+domain+path OVERWRITES that stale cookie. Without this, the browser
  // sends two cookies of the same name to PHP and Drupal's lookup is
  // non-deterministic - for affected users, it usually picks the stale one
  // and treats them as anonymous.
  if (phpHost !== parentDomain.replace(/^\./, '')) {
    cookies.set(sso.cookieName, sso.ssid, {
      ...cookieOpts,
      domain: '.' + phpHost
    })
  }

  // Device tracking cookie (box-<QID>) - cgmembers uses this to recognise the
  // browser as a registered device for this member. Without it, downstream
  // PHP features that look the device up in r_boxes won't recognise the
  // user's machine. Scoped to the same parent domain so it reaches the PHP
  // host.
  if (sso.boxCookieName && sso.boxCookieValue) {
    cookies.set(sso.boxCookieName, sso.boxCookieValue, {
      ...cookieOpts,
      domain: parentDomain
    })
  }
}
