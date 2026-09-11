// Server-side identity: on every SSR + SPA nav, ask PHP who owns the SSO cookie.
// PHP is the single source of truth, so switching accounts on the PHP side is
// reflected on node the next time this load function runs. See lib/server/php-whoami.

import type { LayoutServerLoad } from './$types'
import { env } from '$env/dynamic/private'
import { phpWhoami, type WhoamiUser } from '$lib/server/php-whoami'

export const load: LayoutServerLoad = async ({ cookies }) => {
  const ssoCookieName = env.PHP_SSO_COOKIE_NAME
  if (!ssoCookieName) return { user: null as WhoamiUser | null }

  const ssid = cookies.get(ssoCookieName)
  const user = await phpWhoami(ssid)
  return { user }
}
