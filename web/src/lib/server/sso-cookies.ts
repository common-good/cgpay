// The only place cgpay writes or clears the SSO cookies. A browser keeps one cookie per (name, domain, path),
// sends them all, and both PHP and node read the oldest, so a cookie left under an old scope signs the member
// out even though sign-in succeeded. So every write also expires the same name under every legacy scope, and
// duplicate values are healed on the way in (healSsoCookies).

import type { Cookies } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'
import { phpCookieDomain } from './env'

const OPTS = { path: '/', httpOnly: true, secure: true, sameSite: 'lax' as const }

export type SsoCookies = { cookieName: string; ssid: string; boxCookieName?: string; boxCookieValue?: string }

/**
 * Every Domain the SSO cookies were once written under, other than the current one. When the scope changes, add
 * the old scope here and keep it (see "Common gotchas" in CLAUDE.md).
 *   - before PR #209: the parent of the PHP host, e.g. .commongood.earth
 * Only the cookie names we write are ever expired; other SSESS names at the same domain are not ours.
 */
export function legacyDomains(current: string): string[] {
  const parts = current.replace(/^\./, '').split('.')
  return /^\d+\.\d+\.\d+\.\d+$/.test(current) || parts.length < 3 ? [] : ['.' + parts.slice(-2).join('.')]
}

// cookies.get() returns the first matching cookie set in this response, so callers set the live cookie before expiring the old ones.
const expire = (cookies: Cookies, name: string, current: string) => legacyDomains(current).forEach(d => cookies.delete(name, { path: '/', domain: d }))

/** Write a cookie at the current scope, then expire the same name at every legacy scope. */
export function setSsoCookie(cookies: Cookies, name: string, value: string, domain = phpCookieDomain()) {
  cookies.set(name, value, { ...OPTS, domain })
  expire(cookies, name, domain)
}

/** Put the session cookie (and the device cookie PHP uses to recognise the browser) on the browser. */
export function setSsoCookies(cookies: Cookies, sso: SsoCookies) {
  setSsoCookie(cookies, sso.cookieName, sso.ssid)
  if (sso.boxCookieName && sso.boxCookieValue) setSsoCookie(cookies, sso.boxCookieName, sso.boxCookieValue)
}

/** Sign out: expire the session cookie at the current scope and every legacy scope. The device cookie stays. */
export function clearSsoCookie(cookies: Cookies, name = env.PHP_SSO_COOKIE_NAME as string, domain = phpCookieDomain()) {
  cookies.delete(name, { path: '/', domain })
  expire(cookies, name, domain)
}

/** All values of one cookie name in a Cookie header, in the order the browser sent them (oldest first). */
export function cookieValues(header: string | null | undefined, name: string): string[] {
  const out: string[] = []
  for (const kv of (header ?? '').split(';')) {
    const i = kv.indexOf('=')
    if (i < 0 || kv.slice(0, i).trim() !== name) continue
    const v = kv.slice(i + 1).trim()
    try { out.push(decodeURIComponent(v)) } catch { out.push(v) }
  }
  return out
}

/**
 * Heal a browser that sends the session cookie more than once: find the first value that is a live session
 * (valid(v) asks PHP), write it back at the current scope so the rest of this request uses it, and expire the
 * legacy scopes so the browser stops sending the old ones. One value (the normal case) costs nothing.
 * A stale cookie scoped to the PHP host alone can only be removed by the PHP host itself.
 */
export async function healSsoCookies(cookies: Cookies, header: string | null, valid: (v: string) => Promise<boolean>, name = env.PHP_SSO_COOKIE_NAME as string) {
  const vals = cookieValues(header, name)
  if (vals.length < 2) return
  for (const v of vals) if (await valid(v)) return setSsoCookie(cookies, name, v)
  expire(cookies, name, phpCookieDomain())
}
