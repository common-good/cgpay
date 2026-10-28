// POST /api/reset-verify - stubbed until the PHP /cgpay/reset-verify endpoint lands.
// Field names + response shape mirror /cgpay/sso: cookieName, sid, ssid, boxCookieName,
// boxCookieValue, uid, qid. When the real endpoint lands this becomes a thin proxy that
// forwards those cookies to the browser the same way /api/login does.

import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { validatePassword } from '$lib/reset-validation'

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
  const pErr = validatePassword(newPassword)
  if (pErr) return json({ errors: { newPassword: pErr } }, { status: 400 })

  // Stub rejection path so the UI's "bad code" error can be exercised locally.
  if (code === 'badcode') {
    return json({ errors: { code: 'That code is wrong or has expired.' } }, { status: 400 })
  }

  console.log('[reset-verify] stub accepted', { uid, codeLength: code.length })

  // When the real PHP call is wired in, forward these cookies to the browser the
  // same way /api/login does (parent-domain + php-host-domain overwrite + box cookie).
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
