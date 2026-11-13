import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { env } from '$env/dynamic/private'
import pool from '$lib/server/db'
import { checkPassword } from '$lib/server/drupal-password'
import { dbg, phpLookup, phpSso } from '$lib/server/php-login'
import { setSsoCookies } from '$lib/server/sso-cookies'
import { rateLimit } from '$lib/server/rate-limit'
import type { RowDataPacket } from 'mysql2'

// Admin bypass on non-production. Mirrors the PHP-side dev bypass in
// cgmembers/rcredits/forms/signin.inc:84 - admin (uid=1) may sign in with any
// non-empty password when the site's `pass` column isn't $S$-formatted (i.e.,
// stored as a plain sentinel like 'k' on DEV/test). Enabled by setting
// TEST_ADMIN_BYPASS=1 in the environment's .env; production leaves it unset.
const TEST_ADMIN_BYPASS = env.TEST_ADMIN_BYPASS === '1'
const ADMIN_UID = 1

type UserRow = RowDataPacket & { uid: number; name: string; pass: string }

// A real-looking hash to verify against when the username doesn't exist.
// Keeps response time roughly constant whether the user is real or not, so attackers
// can't enumerate valid usernames via timing.
const DUMMY_HASH = '$S$DummyHashUsedForConstantTimeWhenUserNotFound00000000'

const DEFAULT_MENU = ['Dashboard', 'History', 'Community', 'Settings']

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
  dbg('incoming request:', {
    keys: body ? Object.keys(body) : null,
    identifier,
    passwordType: typeof body?.password,
    passwordLength: typeof body?.password === 'string' ? body.password.length : null
  })
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

  // Non-production admin bypass: mirror the PHP-side dev behavior so admin can
  // sign in against test envs even when users.pass isn't $S$-formatted. Only
  // active when TEST_ADMIN_BYPASS=1 and the identifier resolved to uid 1.
  const adminBypass = TEST_ADMIN_BYPASS
    && user?.uid === ADMIN_UID
    && body.password.length > 0

  dbg('auth check:', {
    uid,
    userFound: !!user,
    storedHashPrefix: user?.pass?.slice(0, 3),
    storedHashLength: user?.pass?.length,
    passwordOk: ok,
    adminBypass
  })

  if (!user || (!ok && !adminBypass)) {
    throw error(401, 'Invalid account ID or password.')
  }

  // Hand off to PHP — this also resolves the user's menu categories
  const sso = await phpSso(user.uid)

  if (sso) setSsoCookies(cookies, sso)

  // Identity is now derived from the SSO cookie on every subsequent request
  // (see +layout.server.ts + /cgpay/whoami). No JWT to return.
  return json({
    name: user.name,
    menu: sso?.menu ?? DEFAULT_MENU
  })
}
