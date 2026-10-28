// POST /api/reset-request - stubbed until the PHP /cgpay/reset-request endpoint lands.
// The field names and response shape match the forgot-password scoping doc so swapping
// the stub for the real PHP call is a one-file change (see /api/signup/+server.ts as
// the matching proxy pattern once we're wiring it for real).

import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { validateResetRequest, type ResetRequestInput } from '$lib/reset-validation'

export const POST: RequestHandler = async ({ request }) => {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return error(400, 'Invalid JSON body')
  }

  if (!body || typeof body !== 'object') return error(400, 'Invalid request body')

  const input = body as Partial<ResetRequestInput>
  const errs = validateResetRequest({
    identifier: String(input.identifier ?? ''),
    channel: (input.channel === 'sms' ? 'sms' : 'email')
  })
  if (Object.keys(errs).length > 0) {
    return json({ errors: errs, message: 'Please fix the errors above.' }, { status: 400 })
  }

  // TODO: swap for a real POST to PHP /cgpay/reset-request once that endpoint ships.
  // The real endpoint always returns 200 (identifier-enumeration guard - see scoping doc).
  // On match it returns { uid, qid }; on no match it returns { uid: 0, qid: '' } with the
  // same shape so the UI can proceed to the verify page without leaking which identifiers exist.
  console.log('[reset-request] stub accepted', {
    identifier: input.identifier,
    channel: input.channel
  })

  return json({ uid: 0, qid: 'STUB', status: 'code_sent', stub: true })
}
