// Aggregate reads for the Super Admin dashboard overview.
//
// Uses the cgweb_ro DB user for direct reads where the permissions allow. For
// fields that live on tables cgweb_ro can't SELECT (historically u_company),
// we fall through to a zero + null flag so the UI can hide affected tiles
// instead of failing the whole page. The right long-term move is a
// `/cgpay-admin-overview` endpoint on the PHP side that returns these
// aggregates in one call; this is the pragmatic MVP until then.

import pool from './db'
import type { RowDataPacket } from 'mysql2'

// Constants from cgmembers/rcredits/defs.inc
const B_OK = 1              // active/approved account
const B_CO = 2              // company account
const CO_SPONSORED = 2      // u_company.coFlags bit index

export type AdminOverview = {
  members: {
    total: number | null       // null = query failed / permission denied
    active: number | null
  }
  sponsees: {
    total: number | null       // fiscally sponsored partners
  }
  transactions: {
    last30d: number | null     // count of primary txs in the last 30 days
  }
  grants: {
    pendingCount: number | null // grants with no received date
  }
}

type CountRow = RowDataPacket & { n: number | string }

async function safeCount(sql: string, params: unknown[] = []): Promise<number | null> {
  try {
    const [rows] = await pool.query<CountRow[]>(sql, params)
    return rows[0] ? Number(rows[0].n) : 0
  } catch (e) {
    console.warn('[admin-stats] query failed, returning null:', (e as Error).message)
    return null
  }
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const nowSec = Math.floor(Date.now() / 1000)
  const thirtyDaysAgo = nowSec - 30 * 24 * 60 * 60

  const [membersTotal, membersActive, sponseesTotal, txs30d, pendingGrants] = await Promise.all([
    safeCount('SELECT COUNT(*) AS n FROM users WHERE uid > 1'),
    safeCount('SELECT COUNT(*) AS n FROM users WHERE uid > 1 AND (flags & ?) > 0', [B_OK]),
    safeCount(
      `SELECT COUNT(*) AS n FROM u_company WHERE (coFlags & (1 << ?)) > 0`,
      [CO_SPONSORED]
    ),
    safeCount('SELECT COUNT(*) AS n FROM txs WHERE type = 1 AND created >= ?', [thirtyDaysAgo]),
    safeCount('SELECT COUNT(*) AS n FROM grants WHERE received IS NULL')
  ])

  return {
    members: { total: membersTotal, active: membersActive },
    sponsees: { total: sponseesTotal },
    transactions: { last30d: txs30d },
    grants: { pendingCount: pendingGrants }
  }
}
