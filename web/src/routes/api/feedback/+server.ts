import { error, json, type RequestHandler } from '@sveltejs/kit'
import { requireUser } from '$lib/server/auth'
import { callPhp, PhpCallError } from '$lib/server/php-client'
import { rateLimit } from '$lib/server/rate-limit'

// A signed-in member's feedback from the website's form. PHP sends it on, as from its help form (see cgpayFeedback).
export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
  const u = await requireUser(cookies)
  const ip = getClientAddress()
  if (!rateLimit(`feedback:${ip}`).ok) throw error(429, 'Too many messages just now. Try again later.')
  const message = String((await request.json().catch(() => ({}))).message ?? '').trim()
  if (!message) throw error(400, 'Type a message first.')
  try {
    if ((await callPhp('cgpay/feedback', { body: { uid: u.uid, message, ip } })).ok) return json({ ok: true })
  } catch (e) { if (!(e instanceof PhpCallError)) throw e }
  throw error(502, 'Your message could not be sent. Try again later.')
}
