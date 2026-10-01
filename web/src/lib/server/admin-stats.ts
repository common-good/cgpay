// Aggregate reads for the Super Admin dashboard overview.
//
// Routes through PHP `/cgpay-admin-overview` so the reads happen under a DB
// user with full access to u_company (cgweb_ro doesn't have SELECT there).
// See cgmembers/rcredits/forms/cgpayadminoverview.inc for the PHP side.
//
// Returns tile-shaped data: each tile is `number | null`, where null means
// the endpoint is unreachable or the response was malformed. The UI treats
// null as `-` on that tile instead of failing the whole page.

import { env } from '$env/dynamic/private'
import type { Cookies } from '@sveltejs/kit'
import { callPhp, PhpCallError } from './php-client'

export type AdminOverview = {
  members: {
    total: number | null
    active: number | null
  }
  sponsees: {
    total: number | null
  }
  transactions: {
    last30d: number | null
  }
  grants: {
    pendingCount: number | null
  }
}

const EMPTY: AdminOverview = {
  members: { total: null, active: null },
  sponsees: { total: null },
  transactions: { last30d: null },
  grants: { pendingCount: null }
}

type OverviewRaw = {
  members?: { total?: unknown; active?: unknown }
  sponsees?: { total?: unknown }
  transactions?: { last30d?: unknown }
  grants?: { pendingCount?: unknown }
}

function asNum(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

export async function getAdminOverview(cookies: Cookies): Promise<AdminOverview> {
  const cookieName = env.PHP_SSO_COOKIE_NAME
  if (!cookieName) return EMPTY
  const ssid = cookies.get(cookieName)
  if (!ssid) return EMPTY

  try {
    const result = await callPhp<OverviewRaw>('/cgpay-admin-overview', {
      method: 'POST',
      body: { ssid }
    })
    if (!result.ok) {
      console.warn(`[admin-stats] /cgpay-admin-overview returned ${result.status}`)
      return EMPTY
    }
    const d = result.data
    return {
      members: {
        total: asNum(d.members?.total),
        active: asNum(d.members?.active)
      },
      sponsees: {
        total: asNum(d.sponsees?.total)
      },
      transactions: {
        last30d: asNum(d.transactions?.last30d)
      },
      grants: {
        pendingCount: asNum(d.grants?.pendingCount)
      }
    }
  } catch (e) {
    if (e instanceof PhpCallError) {
      console.warn(`[admin-stats] ${e.kind}: ${e.message}`)
    } else {
      console.error('[admin-stats] unexpected error:', e)
    }
    return EMPTY
  }
}
