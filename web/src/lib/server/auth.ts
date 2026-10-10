// Cookie-based auth: read the shared SSO cookie and ask PHP who owns it.
// PHP is the single source of truth for identity - see lib/server/php-whoami.

import { error, type Cookies } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'
import { phpWhoami, type WhoamiUser } from './php-whoami'

/**
 * Resolve the current session to a user, or return null if not signed in.
 * Endpoints that permit anonymous callers use this; endpoints that require
 * a signed-in user should use `requireUser` instead.
 */
export async function currentUser(cookies: Cookies): Promise<WhoamiUser | null> {
  const cookieName = env.PHP_SSO_COOKIE_NAME
  if (!cookieName) return null
  return phpWhoami(cookies.get(cookieName))
}

/**
 * Same as `currentUser`, but throws a 401 when no session is present.
 * Use this in endpoints that MUST have a signed-in user.
 */
export async function requireUser(cookies: Cookies): Promise<WhoamiUser> {
  const user = await currentUser(cookies)
  if (!user) throw error(401, 'Sign in required.')
  return user
}
