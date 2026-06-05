// Phase 2 endpoint — returns the data the production member dashboard needs in one call.
// Mirrors the shape of cgmembers/rcredits/forms/api.inc info() so we stay consistent with
// what the PHP app already serves to the existing CGPay PWA.
//
// Status: STUBBED — queries match the documented schema but haven't been verified against
// real data yet (waiting on staging DB access). Treat each query as a starting point;
// expect small adjustments once we run against staging.

import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import pool from '$lib/server/db'
import { bearerFromRequest, verifyToken } from '$lib/server/auth'
import type { RowDataPacket } from 'mysql2'

// Drupal/CG constants from cgmembers/rcredits/defs.inc
const TX_PENDING = -1
const E_PRIME = 1

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

// ---- Response types — the contract the dashboard consumes ----

export type InfoTx = {
  xid: number              // 0 for pending invoices
  pending: boolean
  amount: number           // signed: positive = received, negative = paid
  counterparty: string     // best name of the other party
  description: string
  created: number          // unix seconds
}

export type InfoResponse = {
  uid: number
  name: string
  balance: number
  txs: InfoTx[]
}

// ---- Row shapes ----

type BalanceRow = RowDataPacket & { balance: string | null }
type PendingRow = RowDataPacket & {
  amount: string
  other_uid: number
  description: string | null
  created: number
}
type TxRow = RowDataPacket & {
  xid: number
  amount: string
  other_uid: number
  description: string | null
  created: number
}
type NameRow = RowDataPacket & { uid: number; fullName: string | null; name: string }

export const GET: RequestHandler = async ({ request, url }) => {
  const token = bearerFromRequest(request)
  const claims = token ? verifyToken(token) : null
  if (!claims) throw error(401, 'unauthorized')

  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(url.searchParams.get('limit') ?? DEFAULT_LIMIT)))

  // 1) Balance
  const [balanceRows] = await pool.query<BalanceRow[]>(
    'SELECT balance FROM users WHERE uid = ? LIMIT 1',
    [claims.uid]
  )
  if (!balanceRows[0]) throw error(404, 'user not found')
  const balance = balanceRows[0].balance === null ? 0 : Number(balanceRows[0].balance)

  // 2) Pending invoices (from tx_requests) — direction depends on who's the payer/payee
  // amount is signed: positive when we'd receive, negative when we'd pay
  const [pendingRows] = await pool.query<PendingRow[]>(
    `SELECT
       CASE WHEN payee = ? THEN amount ELSE -amount END AS amount,
       CASE WHEN payee = ? THEN payer ELSE payee END AS other_uid,
       purpose AS description,
       created
     FROM tx_requests
     WHERE (payer = ? OR payee = ?) AND status = ?
     ORDER BY created DESC
     LIMIT ?`,
    [claims.uid, claims.uid, claims.uid, claims.uid, TX_PENDING, limit]
  )

  // 3) Recent completed transactions (from txs) — main pair only (type = E_PRIME)
  const [txRows] = await pool.query<TxRow[]>(
    `SELECT
       xid,
       CASE WHEN uid2 = ? THEN amt ELSE -amt END AS amount,
       CASE WHEN uid2 = ? THEN uid1 ELSE uid2 END AS other_uid,
       for2 AS description,
       created
     FROM txs
     WHERE (uid1 = ? OR uid2 = ?) AND type = ?
     ORDER BY created DESC
     LIMIT ?`,
    [claims.uid, claims.uid, claims.uid, claims.uid, E_PRIME, limit]
  )

  // 4) Look up counterparty names in one query
  const otherUids = Array.from(new Set([
    ...pendingRows.map(r => r.other_uid),
    ...txRows.map(r => r.other_uid)
  ])).filter(u => u != null)

  let names = new Map<number, string>()
  if (otherUids.length > 0) {
    const placeholders = otherUids.map(() => '?').join(',')
    const [nameRows] = await pool.query<NameRow[]>(
      `SELECT uid, fullName, name FROM users WHERE uid IN (${placeholders})`,
      otherUids
    )
    names = new Map(nameRows.map(r => [r.uid, r.fullName || r.name || `Member ${r.uid}`]))
  }

  // 5) Merge + shape
  const txs: InfoTx[] = [
    ...pendingRows.map(r => ({
      xid: 0,
      pending: true,
      amount: Number(r.amount),
      counterparty: names.get(r.other_uid) ?? `Member ${r.other_uid}`,
      description: r.description ?? '',
      created: r.created
    })),
    ...txRows.map(r => ({
      xid: r.xid,
      pending: false,
      amount: Number(r.amount),
      counterparty: names.get(r.other_uid) ?? `Member ${r.other_uid}`,
      description: r.description ?? '',
      created: r.created
    }))
  ].sort((a, b) => b.created - a.created).slice(0, limit)

  const body: InfoResponse = {
    uid: claims.uid,
    name: claims.name,
    balance,
    txs
  }

  return json(body)
}
