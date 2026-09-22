// Server-to-server call to cgmembers /cgpay-whoami.
// Given a session id (the value of the SSESS... cookie), return who owns it.
// See cgmembers/rcredits/forms/cgpaywhoami.inc for the PHP side.

import { callPhp, PhpCallError } from './php-client'

export type WhoamiUser = {
  uid: number
  name: string
  sponsored: boolean
  menu: string[]
}

/**
 * Whoami results carry their failure mode: `no_session` means "the ssid was
 * missing or PHP said 401 - the user is not signed in", while `php_error`
 * covers configuration, network, and unexpected-response cases. Callers can
 * render as anonymous in both cases; the split gives logs enough signal to
 * tell "everything's fine, user isn't signed in" from "PHP is unreachable".
 */
export type WhoamiResult =
  | { ok: true; user: WhoamiUser }
  | { ok: false; reason: 'no_session' | 'php_error' }

type WhoamiRaw = { uid: unknown; name: unknown; sponsored?: unknown; menu?: unknown }

export async function phpWhoami(ssid: string | undefined | null): Promise<WhoamiResult> {
  if (!ssid) return { ok: false, reason: 'no_session' }

  try {
    const result = await callPhp<WhoamiRaw>('/cgpay-whoami', {
      method: 'POST',
      body: { ssid }
    })

    if (!result.ok) {
      // 401 from PHP = valid response, just no session for this ssid.
      return { ok: false, reason: result.status === 401 ? 'no_session' : 'php_error' }
    }

    const data = result.data
    if (typeof data.uid !== 'number' || typeof data.name !== 'string') {
      console.warn('[php-whoami] response missing uid or name:', data)
      return { ok: false, reason: 'php_error' }
    }

    return {
      ok: true,
      user: {
        uid: data.uid,
        name: data.name,
        sponsored: !!data.sponsored,
        menu: Array.isArray(data.menu) ? data.menu.filter((s: unknown): s is string => typeof s === 'string') : []
      }
    }
  } catch (e) {
    if (e instanceof PhpCallError) {
      console.warn(`[php-whoami] ${e.kind}: ${e.message}`)
    } else {
      console.error('[php-whoami] unexpected error:', e)
    }
    return { ok: false, reason: 'php_error' }
  }
}
