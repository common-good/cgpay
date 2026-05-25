import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import pool from '$lib/server/db'
import { checkPassword } from '$lib/server/drupal-password'
import { signToken } from '$lib/server/auth'
import type { RowDataPacket } from 'mysql2'

type UserRow = RowDataPacket & { uid: number; name: string; pass: string }

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json().catch(() => null)
  if (!body || typeof body.name !== 'string' || typeof body.password !== 'string') {
    throw error(400, 'name and password required')
  }

  const [rows] = await pool.query<UserRow[]>(
    'SELECT uid, name, pass FROM users WHERE name = ? LIMIT 1',
    [body.name]
  )
  const user = rows[0]
  if (!user || !checkPassword(body.password, user.pass)) {
    throw error(401, 'invalid credentials')
  }

  const token = signToken({ uid: user.uid, name: user.name })
  return json({ token, name: user.name })
}
