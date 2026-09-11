// Server-to-server call to cgmembers /cgpay-whoami.
// Given a session id (the value of the SSESS... cookie), return who owns it.
// See cgmembers/rcredits/forms/cgpaywhoami.inc for the PHP side.

import { env } from '$env/dynamic/private'

export type WhoamiUser = {
  uid: number
  name: string
  sponsored: boolean
  menu: string[]
}

/**
 * Ask PHP who this session belongs to. Returns null when there's no session,
 * the endpoint isn't configured, or the call fails - callers treat null as
 * "not signed in" and the layout renders the Brand-only header.
 *
 * PHP is the single source of truth: if the user switched accounts on the
 * PHP side, the next call to this reflects the new identity. Node keeps no
 * local claim about who the user is.
 */
export async function phpWhoami(ssid: string | undefined | null): Promise<WhoamiUser | null> {
  if (!ssid) return null

  const ssoUrl = env.PHP_SSO_URL
  const secret = env.PHP_SSO_SECRET
  if (!ssoUrl || !secret) return null

  let whoamiUrl: string
  try {
    const u = new URL(ssoUrl)
    u.pathname = '/cgpay-whoami'
    whoamiUrl = u.toString()
  } catch {
    return null
  }

  try {
    const res = await fetch(whoamiUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-cg-internal-token': secret
      },
      body: JSON.stringify({ ssid })
    })
    if (!res.ok) return null
    const data = await res.json().catch(() => null)
    if (!data || typeof data.uid !== 'number' || typeof data.name !== 'string') return null
    return {
      uid: data.uid,
      name: data.name,
      sponsored: !!data.sponsored,
      menu: Array.isArray(data.menu) ? data.menu.filter((s: unknown) => typeof s === 'string') : []
    }
  } catch {
    return null
  }
}
