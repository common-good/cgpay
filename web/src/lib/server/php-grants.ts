// Server-to-server client for the PHP /cgpay-grants endpoint.
// Auth: X-CG-Internal-Token: <PHP_SSO_SECRET> — same shared secret used by
// /cgpay-sso and /cgpay-lookup (see cgmembers/rcredits/forms/cgpaygrants.inc).

import { env } from '$env/dynamic/private'

export type GrantSummary = {
  id: number
  amount: number
  by: 'ach' | 'check' | 'wire'
  grantor: string
  documented: number | null
  received: number | null
  created: number
}

export type CreateGrantInput = {
  uid: number
  amount: number
  by: 'ach' | 'check' | 'wire'
  fullName: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: number
  zip?: string
}

function config() {
  const url = env.PHP_GRANTS_URL
  const secret = env.PHP_SSO_SECRET
  if (!url || !secret) throw new Error('PHP_GRANTS_URL / PHP_SSO_SECRET not configured')
  return { url, secret }
}

export async function listGrants(uid: number): Promise<GrantSummary[]> {
  const { url, secret } = config()
  const target = url + (url.includes('?') ? '&' : '?') + 'uid=' + encodeURIComponent(String(uid))
  const res = await fetch(target, {
    method: 'GET',
    headers: { 'x-cg-internal-token': secret }
  })
  if (!res.ok) throw new PhpGrantError(`PHP /cgpay-grants list returned ${res.status}`, res.status)
  const data = await res.json()
  if (!Array.isArray(data?.grants)) throw new Error('PHP /cgpay-grants list: unexpected body')
  return data.grants as GrantSummary[]
}

export async function createGrant(input: CreateGrantInput): Promise<number> {
  const { url, secret } = config()
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-cg-internal-token': secret
    },
    body: JSON.stringify(input)
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = (data && typeof data.error === 'string') ? data.error : `PHP /cgpay-grants create returned ${res.status}`
    throw new PhpGrantError(msg, res.status)
  }
  if (!data || typeof data.id !== 'number') throw new Error('PHP /cgpay-grants create: unexpected body')
  return data.id
}

export class PhpGrantError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'PhpGrantError'
    this.status = status
  }
}
