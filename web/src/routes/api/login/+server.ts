import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
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

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
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

  const token = signToken({ uid: user.uid, name: user.name })
  return json({ token, name: user.name })
}
