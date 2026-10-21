// POST /api/signup - stubbed until the PHP /cgpay-signup endpoint lands (KAN-31).
// The field names and response shape match the scoping doc so swapping the
// stub for the real PHP call is a one-file change.

import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { validateSignup, type SignupInput } from '$lib/signup-validation'

export const POST: RequestHandler = async ({ request }) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return error(400, 'Invalid JSON body')
  }

  if (!body || typeof body !== 'object') return error(400, 'Invalid request body')

  const input = body as Partial<SignupInput>
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

  // TODO (KAN-31): swap for a real call to PHP /cgpay-signup once that endpoint ships.
  // Expected response shape per the scoping doc: {uid, status: 'verify_email', qid}.
  // For now, log the submission so a local dev run proves end-to-end wiring and return a stubbed success.
  console.log('[signup] stub accepted', {
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    zip: input.zip
  })

  return json({ uid: 0, status: 'verify_email', qid: 'STUB', stub: true })
}
