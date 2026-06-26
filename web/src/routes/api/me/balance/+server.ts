import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import pool from '$lib/server/db'
import { bearerFromRequest, verifyToken } from '$lib/server/auth'
import type { RowDataPacket } from 'mysql2'

// MariaDB DECIMAL columns come back as strings to preserve precision.
// We convert with Number() because account balances comfortably fit in a JS number
// (Number.MAX_SAFE_INTEGER is over $9 quadrillion). If we ever store larger values
// switch to a Decimal type on the wire.
type BalanceRow = RowDataPacket & { balance: string | null }

export const GET: RequestHandler = async ({ request }) => {
  const token = bearerFromRequest(request)
  const claims = token ? verifyToken(token) : null
  if (!claims) throw error(401, 'unauthorized')

  const [rows] = await pool.query<BalanceRow[]>(
    'SELECT balance FROM users WHERE uid = ? LIMIT 1',
    [claims.uid]
  )
  if (!rows[0]) throw error(404, 'user not found')

  // Treat NULL balance as 0 (matches PHP behavior on COALESCE) but log it — a NULL
  // here likely means the account was created without the trigger firing.
  const raw = rows[0].balance
  const balance = raw === null ? 0 : Number(raw)

  return json({ uid: claims.uid, name: claims.name, balance })
}
