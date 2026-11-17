// The store app's token sign-in: node is a thin proxy to PHP's /cgpay/app-* endpoints (PHP owns passwords, MFA, flood control and the tokens).
// No cookies in or out; the app keeps the token itself. CORS for the app's origins is in hooks.server.ts (appCors).

import { json, type RequestHandler } from '@sveltejs/kit'
import { callPhp, PhpCallError } from './php-client'
import { rateLimit } from './rate-limit'

const NO_STORE = { 'Cache-Control': 'no-store' }

/** The error code PHP sent, or one made from its status. Never anything else, so internals do not leak to the app. */
const errCode = (status: number, body: unknown) => (body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string') ? (body as { error: string }).error : status === 400 ? 'bad-request' : 'failed'

/**
 * Ask PHP's /cgpay/app-<op>, passing on only these string fields of the app's JSON body (plus the member's address, for PHP's flood control).
 * limit: also count the call against a per-address limit (sign-in steps, where someone may be guessing).
 */
export async function appCall(op: string, request: Request, ip: string, fields: string[], limit = false) {
  if (limit) {
    const rl = rateLimit(`app-${op}:${ip}`)
    if (!rl.ok) return { status: 429, data: { error: 'flooding', retryAfterSec: rl.retryAfterSec } }
  }
  const b = await request.json().catch(() => null)
  if (!b || typeof b !== 'object') return { status: 400, data: { error: 'bad-request' } }
  const body: Record<string, string | number | boolean> = { ip }
  for (const f of fields) if (['string', 'number', 'boolean'].includes(typeof b[f])) body[f] = b[f]
  try {
    const r = await callPhp<Record<string, unknown>>(`cgpay/app-${op}`, { body })
    return r.ok ? { status: 200, data: r.data } : { status: r.status === 429 || r.status === 401 || r.status === 403 || r.status === 400 ? r.status : 502, data: { error: errCode(r.status, r.body) } }
  } catch (e) {
    if (!(e instanceof PhpCallError)) throw e
    console.error(`[app-${op}]`, e.message)
    return { status: 502, data: { error: 'unavailable' } }
  }
}

/** A POST handler that proxies /api/app/<op> to PHP (see appCall). */
export const appProxy = (op: string, fields: string[], limit = false): RequestHandler => async ({ request, getClientAddress }) => {
  const { status, data } = await appCall(op, request, getClientAddress(), fields, limit)
  return json(data, { status, headers: NO_STORE })
}
