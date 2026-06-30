import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { env } from '$env/dynamic/private'
import pool from '$lib/server/db'
import { checkPassword } from '$lib/server/drupal-password'
import { signToken } from '$lib/server/auth'
import { rateLimit } from '$lib/server/rate-limit'
import type { RowDataPacket } from 'mysql2'

type UserRow = RowDataPacket & { uid: number; name: string; pass: string }

// A real-looking hash to verify against when the username doesn't exist.
// Keeps response time roughly constant whether the user is real or not, so attackers
// can't enumerate valid usernames via timing.
const DUMMY_HASH = '$S$DummyHashUsedForConstantTimeWhenUserNotFound00000000'

const DEFAULT_MENU = ['Dashboard', 'History', 'Community', 'Settings']

type SsoResponse = {
  cookieName: string
  sid: string
  ssid: string
  menu: string[]
  boxCookieName?: string
  boxCookieValue?: string
}

/**
 * Resolve a user-supplied identifier (account code, username, full name, email,
 * or phone) to a uid via the PHP /cgpay-lookup endpoint. cgmembers owns the
 * matching logic (including the encrypted-email path), so we don't reimplement
 * it here. Returns null if no match — caller still runs checkPassword against
 * DUMMY_HASH for timing parity.
 */
async function phpLookup(identifier: string): Promise<number | null> {
  const ssoUrl = env.PHP_SSO_URL
  const secret = env.PHP_SSO_SECRET
  if (!ssoUrl || !secret) return null

  // /cgpay-lookup lives at the same host as /cgpay-sso. Derive its URL by
  // replacing the path so config stays single-knob.
  let lookupUrl: string
  try {
    const u = new URL(ssoUrl)
    u.pathname = '/cgpay-lookup'
    lookupUrl = u.toString()
  } catch {
    return null
  }

  try {
    const res = await fetch(lookupUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-cg-internal-token': secret
      },
      body: JSON.stringify({ identifier })
    })
    if (res.status === 404) return null
    if (!res.ok) {
      console.error(`[login] PHP lookup returned ${res.status}`)
      return null
    }
    const data = await res.json().catch(() => null)
    if (!data || typeof data.uid !== 'number') return null
    return data.uid
  } catch (e) {
    console.error('[login] PHP lookup network error:', e)
    return null
  }
}

/**
 * Hand off the verified login to the PHP cgmembers site so menu links land
 * pre-authenticated. Returns the session cookie info + the user's menu
 * categories, or null if SSO is not configured (we degrade gracefully — login
 * still succeeds, but PHP links will require a second login).
 */
async function phpSso(uid: number): Promise<SsoResponse | null> {
  const url = env.PHP_SSO_URL
  const secret = env.PHP_SSO_SECRET
  if (!url || !secret) {
    console.warn('[login] PHP_SSO_URL / PHP_SSO_SECRET not configured — skipping PHP session handoff')
    return null
  }

  let res: Response
  try {
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
    throw error(502, 'Unable to complete sign-in — please try again.')
  }

  if (!res.ok) {
    console.error(`[login] PHP SSO returned ${res.status}`)
    throw error(502, 'Unable to complete sign-in — please try again.')
  }

  const data = await res.json().catch(() => null)
  if (!data || typeof data.cookieName !== 'string' || typeof data.ssid !== 'string') {
    console.error('[login] PHP SSO returned unexpected body:', data)
    throw error(502, 'Unable to complete sign-in — please try again.')
  }
  return data as SsoResponse
}

export const POST: RequestHandler = async ({ request, getClientAddress, cookies }) => {
  const ip = getClientAddress()
  const rl = rateLimit(`login:${ip}`)
  if (!rl.ok) {
    throw error(429, `Too many attempts. Try again in ${rl.retryAfterSec}s.`)
  }

  const body = await request.json().catch(() => null)
  // Accept `identifier` (new field name — works for account code / name / email
  // / phone) and the legacy `name` for backwards compat with older clients.
  const identifier = body?.identifier ?? body?.name
  if (!body || typeof identifier !== 'string' || typeof body.password !== 'string') {
    throw error(400, 'identifier and password required')
  }

  // PHP owns the identifier-resolution rules (encrypted email, QID translation,
  // short codes, phone). Returns the uid (or null on no match).
  const uid = await phpLookup(identifier)

  // Lookup the user record by uid. Skipped (and the dummy hash used) when the
  // lookup didn't find anyone — keeps response time roughly constant whether
  // the identifier is real or not.
  let user: UserRow | undefined
  if (uid !== null) {
    const [rows] = await pool.query<UserRow[]>(
      'SELECT uid, name, pass FROM users WHERE uid = ? LIMIT 1',
      [uid]
    )
    user = rows[0]
  }

  // Always run checkPassword so timing doesn't reveal whether the identifier
  // matched anyone.
  const ok = checkPassword(body.password, user?.pass ?? DUMMY_HASH)
  if (!user || !ok) {
    throw error(401, 'Invalid account ID or password.')
  }

  // Hand off to PHP — this also resolves the user's menu categories
  const sso = await phpSso(user.uid)

  if (sso) {
    const cookieOpts = {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax' as const
    }

    // Primary cookie: scoped to the shared parent domain so it reaches every
    // subdomain (including the PHP host).
    cookies.set(sso.cookieName, sso.ssid, {
      ...cookieOpts,
      domain: env.PHP_COOKIE_DOMAIN || undefined
    })

    // Secondary cookie: scoped to the PHP host subdomain with the SAME value.
    // If the user ever signed in directly on that subdomain (e.g. demo) the
    // browser has a stale cookie scoped to it. Setting one with matching
    // name+domain+path OVERWRITES that stale cookie. Without this, the browser
    // sends two cookies of the same name to PHP and Drupal's lookup is
    // non-deterministic — for affected users, it usually picks the stale one
    // and treats them as anonymous.
    try {
      const phpHost = new URL(env.PHP_SSO_URL ?? '').hostname
      if (phpHost && phpHost !== env.PHP_COOKIE_DOMAIN?.replace(/^\./, '')) {
        cookies.set(sso.cookieName, sso.ssid, {
          ...cookieOpts,
          domain: '.' + phpHost
        })
      }
    } catch { /* PHP_SSO_URL missing/malformed — skip */ }

    // Device tracking cookie (box-<QID>) — cgmembers uses this to recognise the
    // browser as a registered device for this member. Without it, downstream
    // PHP features that look the device up in r_boxes won't recognise the
    // user's machine. Scoped to the same parent domain so it reaches the PHP
    // host.
    if (sso.boxCookieName && sso.boxCookieValue) {
      cookies.set(sso.boxCookieName, sso.boxCookieValue, {
        ...cookieOpts,
        domain: env.PHP_COOKIE_DOMAIN || undefined
      })
    }
  }

  const token = signToken({ uid: user.uid, name: user.name })
  return json({
    token,
    name: user.name,
    menu: sso?.menu ?? DEFAULT_MENU
  })
}
