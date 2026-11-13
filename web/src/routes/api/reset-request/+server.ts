import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { rateLimit } from '$lib/server/rate-limit'
import { requestReset } from '$lib/server/reset'

// Always answers the same way once the input is well-formed, so it cannot be used to find out which accounts exist.
export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  const rl = rateLimit(`reset-request:${getClientAddress()}`)
  if (!rl.ok) throw error(429, `Too many attempts. Try again in ${rl.retryAfterSec}s.`)

  const body = await request.json().catch(() => null)
  const identifier = typeof body?.identifier === 'string' ? body.identifier.trim() : ''
  const channel = body?.channel
  if (!identifier || identifier.length > 254) {
    return json({ errors: { identifier: 'Please enter your account ID, email, or phone.' } }, { status: 400 })
  }
  if (channel !== 'email' && channel !== 'sms') {
    return json({ errors: { channel: 'Pick a channel for the code.' } }, { status: 400 })
  }

  try {
    await requestReset(identifier, channel)
  } catch (e) {
    console.error('[reset-request] failed:', e)
  }
  return json({ status: 'code_sent' })
}
