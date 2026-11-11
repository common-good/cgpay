// QR attribution redirect handler. Pure logic + testable.
//
// cg4.us sends every QR scan (and every tagged marketing link) to
// pay.commongood.earth/<a|w|q>=<token>. We set the `ad` cookie on
// `.commongood.earth` so both the pay app and the WordPress site see it,
// then 302 the visitor to the real destination:
//   a= (go-to-app)     -> /welcome (this app)
//   w= (go-to-website) -> https://commongood.earth (WordPress)
//   q= (company ID)    -> /welcome (this app)
//
// The `ad` cookie accumulates every tag the visitor touched before signing up,
// space-separated, so later reports can score by any path (any-three-sources,
// website+two-merchants, etc.) rather than only the last touch.

// Max cookie length. 4KB is the browser limit; we cap well below so other
// cookies on the same domain have headroom.
const MAX_AD_COOKIE_BYTES = 2048

// How long the cookie lives. Long enough that the member can wander through
// several sources over weeks before signing up; a year matches typical
// marketing-cookie conventions.
const AD_COOKIE_MAX_AGE_SECS = 60 * 60 * 24 * 365

const PATH_RE = /^\/(a|w|q)=([A-Za-z0-9][A-Za-z0-9-]{0,99})$/

export type AttributionRedirect = {
  headers: Headers
}

/**
 * If `url.pathname` matches a QR-attribution path, return the Response headers
 * (302 Location + Set-Cookie). Otherwise return null and let the route table
 * handle the request normally.
 */
export function handleQrAttribution(
  url: URL,
  currentAdCookie: string | undefined,
  cookieDomain: string
): AttributionRedirect | null {
  const m = PATH_RE.exec(url.pathname)
  if (!m) return null

  const prefix = m[1] as 'a' | 'w' | 'q'
  const token = m[2]
  const nextAd = appendToken(currentAdCookie ?? '', `${prefix}:${token}`)
  const destination = prefix === 'w' ? 'https://commongood.earth' : '/welcome'

  const headers = new Headers({ Location: destination })
  headers.set('Set-Cookie', serializeAdCookie(nextAd, cookieDomain))
  return { headers }
}

/**
 * Append a token to the space-separated ad cookie, dedupe exact matches so a
 * refresh doesn't grow the cookie unbounded, and trim from the left if we
 * cross the length cap (the oldest sources go first).
 */
export function appendToken(current: string, token: string): string {
  const existing = current.split(' ').filter(Boolean)
  if (existing[existing.length - 1] === token) return current
  const next = [...existing.filter(t => t !== token), token]
  let combined = next.join(' ')
  while (combined.length > MAX_AD_COOKIE_BYTES && next.length > 1) {
    next.shift()
    combined = next.join(' ')
  }
  return combined
}

/**
 * Apex cookie domain for the ad cookie. Scopes to `.commongood.earth` so the
 * cookie is visible at both pay.* (any env) AND the WordPress site at
 * commongood.earth. Different from env.ts's cookieDomainFor(), which scopes
 * the SSO cookie to the PHP host per-env on purpose.
 *   - IPv4 literal   -> hostname as-is (local dev)
 *   - localhost      -> localhost (local dev)
 *   - a.b.c.foo.tld  -> .foo.tld (last two labels, apex)
 */
export function apexCookieDomain(hostname: string): string {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return hostname
  const parts = hostname.split('.')
  if (parts.length < 2) return hostname
  return '.' + parts.slice(-2).join('.')
}

function serializeAdCookie(value: string, domain: string): string {
  // Not HttpOnly: /api/signup reads it via request headers (same as HttpOnly),
  // but staff reports sometimes inspect it in DevTools, which HttpOnly blocks.
  // SameSite=Lax so the cookie is sent on cross-site top-level navigations
  // (the QR scan + redirect itself), which is the whole point.
  const parts = [
    `ad=${encodeURIComponent(value)}`,
    `Domain=${domain}`,
    'Path=/',
    `Max-Age=${AD_COOKIE_MAX_AGE_SECS}`,
    'SameSite=Lax',
    'Secure'
  ]
  return parts.join('; ')
}
