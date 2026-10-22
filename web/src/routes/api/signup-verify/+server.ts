// POST /api/signup-verify - stubbed until the PHP /cgpay-signup-verify endpoint lands.
// Field names + response shape match what the real PHP call will return (same shape
// as /cgpay-sso): cookieName, sid, ssid, boxCookieName, boxCookieValue, uid, qid.
// When the real endpoint lands, this becomes a thin proxy that forwards those cookies
// to the browser the same way /api/login does.

import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

type VerifyBody = {
  uid?: unknown
  code?: unknown
  newPassword?: unknown
}

export const POST: RequestHandler = async ({ request }) => {
  let body: VerifyBody
  try {
    body = await request.json()
  } catch {
    return error(400, 'Invalid JSON body')
  }

  const uid = typeof body.uid === 'number' ? body.uid : 0
  const code = typeof body.code === 'string' ? body.code.trim() : ''
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''

  if (!uid || !code || !newPassword) {
    return json({ message: 'uid, code, and newPassword are required.' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return json({ errors: { newPassword: 'Password must be at least 8 characters.' } }, { status: 400 })
  }

  // Stub rejection path so the UI's "bad code" error can be exercised locally.
  if (code === 'badcode') {
    return json({ errors: { code: 'That code is wrong or has expired.' } }, { status: 400 })
  }

  console.log('[signup-verify] stub accepted', { uid, codeLength: code.length })

  // When the real PHP call is wired in, forward these cookies to the browser
  // the same way /api/login does (set SSO cookie on parent + php-host domain,
  // set box cookie on parent domain).
  return json({
    uid,
    qid: 'STUB',
    cookieName: 'SESSstub',
    sid: 'stub-session-id',
    ssid: 'stub-session-id',
    boxCookieName: 'box-STUB',
    boxCookieValue: 'stub-box-value',
    stub: true
  })
}
