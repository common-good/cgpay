// Server-side client for /cgpay-admin-user-update. Pushes a subset of
// contact fields back to PHP, which applies the diff + writes a `changes`
// audit row per field that actually changed. See cgmembers-frame
// forms/cgpayadminuserupdate.inc.

import { env } from '$env/dynamic/private'
import type { Cookies } from '@sveltejs/kit'
import { callPhp, PhpCallError } from './php-client'

export type UserUpdateFields = {
  fullName?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
}

export type UserUpdateResult =
  | { ok: true; updated: string[] }
  | { ok: false; status: number; message?: string; fieldErrors?: Record<string, string> }

type Raw = { ok?: boolean; updated?: unknown; message?: unknown; errors?: unknown }

export async function updateAdminUser(
  cookies: Cookies,
  uid: number,
  fields: UserUpdateFields
): Promise<UserUpdateResult> {
  const cookieName = env.PHP_SSO_COOKIE_NAME
  if (!cookieName) return { ok: false, status: 500, message: 'PHP_SSO_COOKIE_NAME not configured on this environment.' }
  const ssid = cookies.get(cookieName)
  if (!ssid) return { ok: false, status: 401, message: 'Sign in required.' }

  try {
    const result = await callPhp<Raw>('/cgpay-admin-user-update', {
      method: 'POST',
      body: { ssid, uid, fields }
    })
    if (!result.ok) {
      const body = result.body as Raw | null
      const fieldErrors = (body && body.errors && typeof body.errors === 'object')
        ? body.errors as Record<string, string>
        : undefined
      const message = (body && typeof body.message === 'string') ? body.message : `Update failed (${result.status})`
      return { ok: false, status: result.status, message, fieldErrors }
    }
    const updated = Array.isArray(result.data.updated)
      ? result.data.updated.filter((s: unknown): s is string => typeof s === 'string')
      : []
    return { ok: true, updated }
  } catch (e) {
    if (e instanceof PhpCallError) console.warn(`[admin-user-update] ${e.kind}: ${e.message}`)
    else console.error('[admin-user-update] unexpected error:', e)
    return { ok: false, status: 502, message: 'Could not reach the member site. Try again in a moment.' }
  }
}
