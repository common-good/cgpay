// Single-user detail read for the admin dashboard - profile + recent txs +
// grants history. Routes through PHP /cgpay-admin-user; see cgmembers-frame
// forms/cgpayadminuser.inc.

import { env } from '$env/dynamic/private'
import type { Cookies } from '@sveltejs/kit'
import { callPhp, PhpCallError } from './php-client'

export type AdminUserProfile = {
  uid: number
  qid: string
  name: string
  loginName: string
  fullName: string
  email: string
  phone: string
  created: number
  flags: number
  balance: number
  co: boolean
  sponsored: boolean
  admin: boolean
}

export type AdminUserTx = {
  xid: number
  amount: number
  counterparty: string
  description: string
  created: number
}

export type AdminUserGrant = {
  id: number
  amount: number
  by: string
  grantor: string
  documented: number | null
  received: number | null
  created: number
}

export type AdminUserDetail = {
  user: AdminUserProfile
  txs: AdminUserTx[]
  grants: AdminUserGrant[]
}

type Options = { txLimit?: number; grantsLimit?: number }

/**
 * Fetch a single user's profile + txs + grants. Returns null on any failure
 * (unknown uid, non-admin caller, PHP down, config missing) - the page layer
 * decides how to render that (currently: 404).
 */
export async function getAdminUser(
  cookies: Cookies,
  uid: number,
  { txLimit = 50, grantsLimit = 50 }: Options = {}
): Promise<AdminUserDetail | null> {
  const cookieName = env.PHP_SSO_COOKIE_NAME
  if (!cookieName) return null
  const ssid = cookies.get(cookieName)
  if (!ssid) return null

  try {
    const result = await callPhp<AdminUserDetail>('/cgpay-admin-user', {
      method: 'POST',
      body: { ssid, uid, txLimit, grantsLimit }
    })
    if (!result.ok) {
      console.warn(`[admin-user] /cgpay-admin-user returned ${result.status}`)
      return null
    }
    return result.data
  } catch (e) {
    if (e instanceof PhpCallError) console.warn(`[admin-user] ${e.kind}: ${e.message}`)
    else console.error('[admin-user] unexpected error:', e)
    return null
  }
}
