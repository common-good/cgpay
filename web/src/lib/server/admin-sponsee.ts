// Sponsee detail read for the admin dashboard - identity + grants rollups +
// relations + grants history + tx history. Routes through PHP
// /cgpay-admin-sponsee; see cgmembers-frame forms/cgpayadminsponsee.inc.

import { env } from '$env/dynamic/private'
import type { Cookies } from '@sveltejs/kit'
import { callPhp, PhpCallError } from './php-client'

export type AdminSponseeProfile = {
  uid: number
  qid: string
  name: string
  legalName: string
  federalId: string
  created: number
  flags: number
  balance: number
  lastActivity: number
  sponsored: boolean
  co: boolean
}

export type AdminSponseeRollups = {
  expectedTotal: number
  receivedTotal: number
  expectedCount: number
  receivedCount: number
  memberCount: number
}

export type AdminSponseeRelation = {
  reid: number
  uid: number
  qid: string
  name: string
  permission: number
  permissionLabel: string
  owner: boolean
  employee: boolean
  customer: boolean
  autopay: boolean
  draw: boolean
}

export type AdminSponseeGrant = {
  id: number
  amount: number
  by: string
  grantor: string
  documented: number | null
  received: number | null
  created: number
}

export type AdminSponseeTx = {
  xid: number
  amount: number
  counterparty: string
  description: string
  created: number
}

export type AdminSponseeDetail = {
  sponsee: AdminSponseeProfile
  rollups: AdminSponseeRollups
  relations: AdminSponseeRelation[]
  grants: AdminSponseeGrant[]
  txs: AdminSponseeTx[]
}

type Options = { txLimit?: number; grantsLimit?: number }

export async function getAdminSponsee(
  cookies: Cookies,
  uid: number,
  { txLimit = 50, grantsLimit = 100 }: Options = {}
): Promise<AdminSponseeDetail | null> {
  const cookieName = env.PHP_SSO_COOKIE_NAME
  if (!cookieName) return null
  const ssid = cookies.get(cookieName)
  if (!ssid) return null

  try {
    const result = await callPhp<AdminSponseeDetail>('/cgpay-admin-sponsee', {
      method: 'POST',
      body: { ssid, uid, txLimit, grantsLimit }
    })
    if (!result.ok) {
      console.warn(`[admin-sponsee] /cgpay-admin-sponsee returned ${result.status}`)
      return null
    }
    return result.data
  } catch (e) {
    if (e instanceof PhpCallError) console.warn(`[admin-sponsee] ${e.kind}: ${e.message}`)
    else console.error('[admin-sponsee] unexpected error:', e)
    return null
  }
}
