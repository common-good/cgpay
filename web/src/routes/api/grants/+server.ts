// Phase 3 endpoint — Expected Grants list + create.
// GET  → sponsee's own grants (via PHP /cgpay-grants)
// POST → create a new expected grant for the signed-in sponsee

import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { bearerFromRequest, verifyToken } from '$lib/server/auth'
import { listGrants, createGrant, PhpGrantError, type CreateGrantInput } from '$lib/server/php-grants'

function requireClaims(request: Request) {
  const token = bearerFromRequest(request)
  const claims = token ? verifyToken(token) : null
  if (!claims) throw error(401, 'unauthorized')
  return claims
}

export const GET: RequestHandler = async ({ request }) => {
  const claims = requireClaims(request)
  try {
    const grants = await listGrants(claims.uid)
    return json({ grants })
  } catch (e) {
    if (e instanceof PhpGrantError && e.status === 403) throw error(403, 'not a sponsored partner')
    console.error('[grants] list failed:', e)
    throw error(502, 'Unable to load grants — please try again.')
  }
}

const ALLOWED_BY = new Set(['ach', 'check', 'wire'])

export const POST: RequestHandler = async ({ request }) => {
  const claims = requireClaims(request)

  const body = await request.json().catch(() => null)
  if (!body) throw error(400, 'invalid request body')

  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''
  const amount = Number(body.amount)
  const by = typeof body.by === 'string' ? body.by.toLowerCase() : ''

  if (!fullName) throw error(400, 'grantor name required')
  if (!Number.isFinite(amount) || amount <= 0) throw error(400, 'amount must be greater than zero')
  if (!ALLOWED_BY.has(by)) throw error(400, 'payment method must be ach, check, or wire')

  const input: CreateGrantInput = {
    uid: claims.uid,
    fullName,
    amount,
    by: by as 'ach' | 'check' | 'wire'
  }
  for (const k of ['email', 'phone', 'address', 'city', 'zip'] as const) {
    if (typeof body[k] === 'string' && body[k].trim()) input[k] = body[k].trim()
  }
  if (body.state != null && Number.isFinite(Number(body.state))) input.state = Number(body.state)

  try {
    const id = await createGrant(input)
    return json({ id })
  } catch (e) {
    if (e instanceof PhpGrantError && e.status === 400) throw error(400, e.message)
    if (e instanceof PhpGrantError && e.status === 403) throw error(403, 'not a sponsored partner')
    console.error('[grants] create failed:', e)
    throw error(502, 'Unable to save the grant — please try again.')
  }
}
