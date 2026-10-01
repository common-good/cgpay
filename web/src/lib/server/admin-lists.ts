// Paginated list reads for the admin Members and Sponsees tables.
// Routes through PHP /cgpay-admin-members and /cgpay-admin-sponsees so the
// DB queries run under a user with full access. See cgmembers-frame
// forms/cgpayadminmembers.inc and cgpayadminsponsees.inc.

import { env } from '$env/dynamic/private'
import type { Cookies } from '@sveltejs/kit'
import { callPhp, PhpCallError } from './php-client'

export type MemberRow = {
  uid: number
  qid: string
  name: string
  created: number    // unix seconds
  balance: number
  flags: number
}

export type SponseeRow = {
  uid: number
  qid: string
  name: string
  legalName: string
  federalId: string
  balance: number
  expectedGrantsTotal: number
  receivedGrantsTotal: number
  lastActivity: number
}

export type Paginated<T> = {
  items: T[]
  total: number
  limit: number
  offset: number
}

const EMPTY = <T>(limit: number, offset: number): Paginated<T> =>
  ({ items: [], total: 0, limit, offset })

type ListOptions = { limit?: number; offset?: number }
type MembersListOptions = ListOptions & { q?: string }

function ssidOrNull(cookies: Cookies): string | null {
  const cookieName = env.PHP_SSO_COOKIE_NAME
  if (!cookieName) return null
  return cookies.get(cookieName) ?? null
}

export async function getMembersList(
  cookies: Cookies,
  { limit = 25, offset = 0, q = '' }: MembersListOptions = {}
): Promise<Paginated<MemberRow>> {
  const ssid = ssidOrNull(cookies)
  if (!ssid) return EMPTY(limit, offset)

  try {
    const result = await callPhp<Paginated<MemberRow>>('/cgpay-admin-members', {
      method: 'POST',
      body: { ssid, limit, offset, q }
    })
    if (!result.ok) {
      console.warn(`[admin-lists] /cgpay-admin-members returned ${result.status}`)
      return EMPTY(limit, offset)
    }
    return result.data
  } catch (e) {
    if (e instanceof PhpCallError) console.warn(`[admin-lists] members: ${e.kind}: ${e.message}`)
    else console.error('[admin-lists] members unexpected error:', e)
    return EMPTY(limit, offset)
  }
}

export async function getSponseesList(
  cookies: Cookies,
  { limit = 25, offset = 0 }: ListOptions = {}
): Promise<Paginated<SponseeRow>> {
  const ssid = ssidOrNull(cookies)
  if (!ssid) return EMPTY(limit, offset)

  try {
    const result = await callPhp<Paginated<SponseeRow>>('/cgpay-admin-sponsees', {
      method: 'POST',
      body: { ssid, limit, offset }
    })
    if (!result.ok) {
      console.warn(`[admin-lists] /cgpay-admin-sponsees returned ${result.status}`)
      return EMPTY(limit, offset)
    }
    return result.data
  } catch (e) {
    if (e instanceof PhpCallError) console.warn(`[admin-lists] sponsees: ${e.kind}: ${e.message}`)
    else console.error('[admin-lists] sponsees unexpected error:', e)
    return EMPTY(limit, offset)
  }
}
