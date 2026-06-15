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
  if (!body || typeof body.name !== 'string' || typeof body.password !== 'string') {
    throw error(400, 'name and password required')
  }

  // Drupal usernames are case-insensitive on lookup.
  const [rows] = await pool.query<UserRow[]>(
    'SELECT uid, name, pass FROM users WHERE LOWER(name) = LOWER(?) LIMIT 1',
    [body.name]
  )
  const user = rows[0]

  // Always run checkPassword so timing doesn't reveal whether the user exists.
  const ok = checkPassword(body.password, user?.pass ?? DUMMY_HASH)
  if (!user || !ok) {
    throw error(401, 'Invalid username or password.')
  }

  // Hand off to PHP — this also resolves the user's menu categories
  const sso = await phpSso(user.uid)

  // Set the PHP session cookie scoped to the shared parent domain so it reaches
  // the PHP host as well. Drupal HTTPS sessions use the ssid value.
  if (sso) {
    cookies.set(sso.cookieName, sso.ssid, {
      path: '/',
      domain: env.PHP_COOKIE_DOMAIN || undefined,
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    })
  }

  const token = signToken({ uid: user.uid, name: user.name })
  return json({
    token,
    name: user.name,
    menu: sso?.menu ?? DEFAULT_MENU
  })
}
