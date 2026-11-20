// QR attribution redirect handler. Pure logic + testable.
//
// cg4.us sends every QR scan (and every tagged marketing link) to
// pay.commongood.earth/<a|w|q>=<token>. We set the `ad` cookie on the same
// domain as the SSO cookie (phpCookieDomain, e.g. .members.commongood.earth in
// production, .test.commongood.earth on test), so only the members/pay side
// reads it. Every reader is on that side: cgmembers-frame's legacy forms
// (signup.inc, sponsor.inc, investinterest.inc) read $_COOKIE['ad'] on the PHP
// host, and cgpay's /api/signup forwards it as source2. WordPress neither sets
// nor reads it. Then we 302 the visitor to the real destination:
//   a= (go-to-app)     -> /welcome (this app)
//   w= (go-to-website) -> https://commongood.earth (WordPress)
//   q= (company ID)    -> /welcome (this app)
//
// The `ad` cookie accumulates every tag the visitor touched before signing up,
// space-separated, so later reports can score by any path (any-three-sources,
// website+two-merchants, etc.) rather than only the last touch. The order is
// most-recent-last: re-touching an earlier source promotes it to the end
// instead of preserving first-touch order. That's intentional so a staff view
// of the raw cookie reads the same as a sign-in log.

// Max cookie length. Browsers cap each cookie at 4096 bytes including the
// name + attributes; we cap the sent value (URL-encoded) well below that so
// other cookies on the same domain have headroom.
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
 * refresh doesn't grow the cookie unbounded, and trim from the left when the
 * URL-encoded value crosses the length cap (the oldest sources go first, and
 * the measurement is on the encoded value because that's what the browser
 * actually transmits).
 */
export function appendToken(current: string, token: string): string {
  const existing = current.split(' ').filter(Boolean)
  if (existing[existing.length - 1] === token) return current
  const next = [...existing.filter(t => t !== token), token]
  while (encodeURIComponent(next.join(' ')).length > MAX_AD_COOKIE_BYTES && next.length > 1) {
    next.shift()
  }
  return next.join(' ')
}

function serializeAdCookie(value: string, domain: string): string {
  // HttpOnly: the cookie is read server-side on /api/signup (see cgmembers-frame
  // #86's cgpay/signup.inc) and nothing in the browser reads it, so HttpOnly
  // closes an XSS exfil path at no cost. SameSite=Lax so the cookie is sent on
  // cross-site top-level navigations (the QR scan + redirect itself), which is
  // the whole point.
  const parts = [
    `ad=${encodeURIComponent(value)}`,
    `Domain=${domain}`,
    'Path=/',
    `Max-Age=${AD_COOKIE_MAX_AGE_SECS}`,
    'HttpOnly',
    'SameSite=Lax',
    'Secure'
  ]
  return parts.join('; ')
}
