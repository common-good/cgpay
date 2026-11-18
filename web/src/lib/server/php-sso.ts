import { error } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'
import { phpUrl } from '$lib/utils'

const DEBUG_LOGIN = env.DEBUG_LOGIN === '1'
const dbg = (...args: unknown[]) => { if (DEBUG_LOGIN) console.log('[login:debug]', ...args) }

export type SsoResponse = {
  cookieName: string
  sid: string
  ssid: string
  menu: string[]
  boxCookieName?: string
  boxCookieValue?: string
}

/**
 * Hand off the verified login to the PHP cgmembers site so menu links land
 * pre-authenticated. Returns the session cookie info + the user's menu
 * categories, or null if SSO is not configured (we degrade gracefully - login
 * still succeeds, but PHP links will require a second login).
 * acct: the account the member acts for (the store app's choice), if not their own.
 */
export async function phpSso(uid: number, acct = 0): Promise<SsoResponse | null> {
  const secret = env.PHP_SSO_SECRET
  if (!secret) {
    console.warn('[login] PHP_SSO_SECRET not configured - skipping PHP session handoff')
    return null
  }

  let res: Response
  try {
    const url = phpUrl('cgpay/sso')
    dbg('sso request:', { url, body: { uid, acct }, tokenLength: secret.length })
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-cg-internal-token': secret
      },
      body: JSON.stringify(acct && acct !== uid ? { uid, acct } : { uid })
    })
  } catch (e) {
    console.error('[login] PHP SSO network error:', e)
    throw error(502, 'Unable to complete sign-in - please try again.')
  }

  dbg('sso response status:', res.status)
  if (!res.ok) {
    console.error(`[login] PHP SSO returned ${res.status}`)
    throw error(502, 'Unable to complete sign-in - please try again.')
  }

  const data = await res.json().catch(() => null)
  if (!data || typeof data.cookieName !== 'string' || typeof data.ssid !== 'string') {
    console.error('[login] PHP SSO returned unexpected body:', data)
    throw error(502, 'Unable to complete sign-in - please try again.')
  }
  return data as SsoResponse
}
