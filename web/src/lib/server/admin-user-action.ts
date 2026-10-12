// Server-side client for /cgpay-admin-user-action. Toggles B_OK on a target
// account; writes an audit row on the PHP side. See cgmembers-frame
// forms/cgpayadminuseraction.inc.

import { env } from '$env/dynamic/private'
import type { Cookies } from '@sveltejs/kit'
import { callPhp, PhpCallError } from './php-client'

export type UserAction = 'activate' | 'deactivate'

export type UserActionResult =
  | { ok: true; action: UserAction; flagsAfter: number; noop: boolean }
  | { ok: false; status: number; message: string }

type Raw = { ok?: boolean; action?: unknown; flagsAfter?: unknown; noop?: unknown; message?: unknown }

export async function runAdminUserAction(
  cookies: Cookies,
  uid: number,
  action: UserAction
): Promise<UserActionResult> {
  const cookieName = env.PHP_SSO_COOKIE_NAME
  if (!cookieName) return { ok: false, status: 500, message: 'PHP_SSO_COOKIE_NAME not configured.' }
  const ssid = cookies.get(cookieName)
  if (!ssid) return { ok: false, status: 401, message: 'Sign in required.' }

  try {
    const result = await callPhp<Raw>('/cgpay-admin-user-action', {
      method: 'POST',
      body: { ssid, uid, action }
    })
    if (!result.ok) {
      const body = result.body as Raw | null
      const message = (body && typeof body.message === 'string')
        ? body.message
        : result.status === 403 ? 'You cannot act on your own account from the admin screen.'
        : result.status === 404 ? 'Account not found.'
        : `Action failed (${result.status})`
      return { ok: false, status: result.status, message }
    }
    return {
      ok: true,
      action,
      flagsAfter: typeof result.data.flagsAfter === 'number' ? result.data.flagsAfter : 0,
      noop: result.data.noop === true
    }
  } catch (e) {
    if (e instanceof PhpCallError) console.warn(`[admin-user-action] ${e.kind}: ${e.message}`)
    else console.error('[admin-user-action] unexpected error:', e)
    return { ok: false, status: 502, message: 'Could not reach the member site. Try again in a moment.' }
  }
}
