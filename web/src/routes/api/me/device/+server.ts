import { json, error } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'
import type { RequestHandler } from './$types'
import { requireUser } from '$lib/server/auth'
import { phpDevice } from '$lib/server/php-device'

// The store app's live dashboard hands these to the app's bundled screens, which transact with PHP directly (online or later from a queue).
export const GET: RequestHandler = async ({ cookies }) => {
  await requireUser(cookies)
  const device = await phpDevice(cookies.get(env.PHP_SSO_COOKIE_NAME as string)!)
  if (!device) throw error(403, 'This account cannot use the app yet.')
  return json(device, { headers: { 'Cache-Control': 'no-store' } })
}
