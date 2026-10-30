// POST /api/signup - proxies the new-member signup form to PHP /cgpay/signup.
// PHP owns account creation, uniqueness checks, invitation chain, and the
// verification-code email; we only shape the request and forward.

import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { env } from '$env/dynamic/private'
import { phpUrl } from '$lib/utils'
import { rateLimit } from '$lib/server/rate-limit'
import { validateSignup, type SignupInput } from '$lib/signup-validation'

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  // Each successful call creates an account, sends email, and notifies staff
  // (tellStaffNewMember). Rate-limit by client IP so a bad actor can't flood
  // the DB + inboxes. Mirrors the /api/login limiter.
  const ip = getClientAddress()
  const rl = rateLimit(`signup:${ip}`)
  if (!rl.ok) {
    throw error(429, `Too many attempts. Try again in ${rl.retryAfterSec}s.`)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return error(400, 'Invalid JSON body')
  }

  if (!body || typeof body !== 'object') return error(400, 'Invalid request body')

  const input = body as Partial<SignupInput> & {
    invitationCode?: string
    source?: string
    captchaToken?: string
  }

  // Server-side re-validation: the client already ran the same checks, but
  // never trust what the browser sent. Returns 400 w/ per-field errors so the
  // form can show them inline.
  const errs = validateSignup({
    fullName: String(input.fullName ?? ''),
    email: String(input.email ?? ''),
    phone: String(input.phone ?? ''),
    zip: String(input.zip ?? ''),
    country: typeof input.country === 'number' ? input.country : undefined,
    agreementAccepted: !!input.agreementAccepted
  }, !input.country || input.country === 1228)
  if (Object.keys(errs).length > 0) {
    return json({ errors: errs, message: 'Please fix the errors above.' }, { status: 400 })
  }

  const secret = env.PHP_SSO_SECRET
  if (!secret) {
    console.error('[signup] PHP_SSO_SECRET not configured')
    return error(502, 'Signup is temporarily unavailable - please try again later.')
  }

  const payload = {
    fullName: String(input.fullName),
    email: String(input.email),
    phone: String(input.phone),
    zip: String(input.zip),
    country: typeof input.country === 'number' ? input.country : 1228,
    agreementAccepted: true,
    ...(input.captchaToken ? { captchaToken: String(input.captchaToken) } : {}),
    ...(input.invitationCode ? { invitationCode: String(input.invitationCode) } : {}),
    ...(input.source ? { source: String(input.source) } : {})
  }

  let res: Response
  try {
    res = await fetch(phpUrl('cgpay/signup'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-cg-internal-token': secret
      },
      body: JSON.stringify(payload)
    })
  } catch (e) {
    console.error('[signup] PHP network error:', e)
    return error(502, 'Unable to reach the signup service - please try again.')
  }

  const text = await res.text()
  let data: unknown = null
  try { data = text ? JSON.parse(text) : null } catch { /* non-JSON PHP response */ }

  // PHP returns 400-ish with { errors: { field: msg } } on validation failures.
  if (!res.ok) {
    if (data && typeof data === 'object' && 'errors' in data) {
      return json(data, { status: 400 })
    }
    console.error(`[signup] PHP /cgpay/signup returned ${res.status}: ${text.slice(0, 300)}`)
    return error(502, 'Signup failed - please try again.')
  }

  if (!data || typeof data !== 'object' || typeof (data as { uid?: unknown }).uid !== 'number') {
    console.error('[signup] PHP /cgpay/signup returned unexpected body:', text.slice(0, 300))
    return error(502, 'Signup failed - please try again.')
  }

  // Pass through PHP's response shape: { uid, qid, status: 'verify_email' }.
  return json(data)
}
