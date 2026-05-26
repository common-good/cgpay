import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import pool from '$lib/server/db'
import { bearerFromRequest, verifyToken } from '$lib/server/auth'
import type { RowDataPacket } from 'mysql2'

type BalanceRow = RowDataPacket & { balance: string }

export const GET: RequestHandler = async ({ request }) => {
  const token = bearerFromRequest(request)
  const claims = token ? verifyToken(token) : null
  if (!claims) throw error(401, 'unauthorized')

  const [rows] = await pool.query<BalanceRow[]>(
    'SELECT balance FROM users WHERE uid = ? LIMIT 1',
    [claims.uid]
  )
  if (!rows[0]) throw error(404, 'user not found')

  return json({ uid: claims.uid, name: claims.name, balance: Number(rows[0].balance) })
}
