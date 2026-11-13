import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { rateLimit } from '$lib/server/rate-limit'
import { verifyReset } from '$lib/server/reset'
import { phpSso } from '$lib/server/php-login'
import { setSsoCookies } from '$lib/server/sso-cookies'

const BAD_CODE = { errors: { code: 'That code is wrong or has expired.' } }

// Sets the new password if the code is right, then signs the member in like /api/login does.
export const POST: RequestHandler = async ({ request, getClientAddress, cookies }) => {
  const rl = rateLimit(`reset-verify:${getClientAddress()}`)
  if (!rl.ok) throw error(429, `Too many attempts. Try again in ${rl.retryAfterSec}s.`)

  const body = await request.json().catch(() => null)
  const identifier = typeof body?.identifier === 'string' ? body.identifier.trim() : ''
  const code = typeof body?.code === 'string' ? body.code.trim() : ''
  const pw = typeof body?.newPassword === 'string' ? body.newPassword : ''
  if (!identifier || identifier.length > 254) throw error(400, 'identifier, code, and newPassword are required.')
  if (!/^[0-9]{6}$/.test(code)) return json(BAD_CODE, { status: 400 })
  if (pw.length < 8 || pw.length > 128) return json({ errors: { newPassword: 'Password must be 8 to 128 characters.' } }, { status: 400 })

  const r = await verifyReset(identifier, code, pw)
  if (!r.ok) {
    if (r.why === 'bad_code') return json(BAD_CODE, { status: 400 })
    if (r.why === 'bad_password') return json({ errors: { newPassword: 'That password is not acceptable.' } }, { status: 400 })
    throw error(502, 'Unable to reset the password - please try again.')
  }

  const sso = await phpSso(r.uid)
  if (sso) setSsoCookies(cookies, sso)
  return json({ menu: sso?.menu ?? null })
}
