// Server-side identity: ask PHP who owns the SSO cookie. PHP is the single source
// of truth, so switching accounts on the PHP side is reflected on node the next
// time this load function runs. That's every full page load, but not client-side
// navigation (SvelteKit doesn't track cookies) unless the caller invalidates.
// See lib/server/php-whoami.

import type { LayoutServerLoad } from './$types'
import { env } from '$env/dynamic/private'
import { phpWhoami, type WhoamiUser } from '$lib/server/php-whoami'

export const load: LayoutServerLoad = async ({ cookies }) => {
  // Startup validation (hooks.server.ts) guarantees PHP_SSO_COOKIE_NAME is
  // set; previously a missing value silently returned `user: null` here, so
  // login looked successful but every page bounced back to /login.
  const ssoCookieName = env.PHP_SSO_COOKIE_NAME as string
  const result = await phpWhoami(cookies.get(ssoCookieName))
  return { user: (result.ok ? result.user : null) as WhoamiUser | null }
}
