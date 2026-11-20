import { describe, it, expect } from 'vitest'
import { handleQrAttribution, appendToken } from '../../src/lib/server/qr-attribution'

describe('appendToken', () => {
  it('appends to an empty cookie', () => {
    expect(appendToken('', 'a:cge2606')).toBe('a:cge2606')
  })

  it('appends in order', () => {
    expect(appendToken('a:cge2606', 'w:card2606')).toBe('a:cge2606 w:card2606')
  })

  it('no-ops if the new token is the last one', () => {
    // A refresh of the same QR should not grow the cookie.
    expect(appendToken('a:cge2606 w:card2606', 'w:card2606')).toBe('a:cge2606 w:card2606')
  })

  it('moves an earlier duplicate to the end (most-recent-last is intentional)', () => {
    expect(appendToken('a:cge2606 w:card2606', 'a:cge2606')).toBe('w:card2606 a:cge2606')
  })

  it('trims from the left when the URL-encoded value crosses the 2048 cap', () => {
    // 500 short tokens: raw length is well under 2048 but encoded blows past it,
    // so the trim has to measure the encoded form (what the browser transmits).
    const long = Array.from({ length: 500 }, (_, i) => `a:token${i}`).join(' ')
    const result = appendToken(long, 'a:newest')
    expect(encodeURIComponent(result).length).toBeLessThanOrEqual(2048)
    expect(result.endsWith('a:newest')).toBe(true)
    expect(result.includes('a:token0')).toBe(false)
  })
})

describe('handleQrAttribution', () => {
  const domain = '.commongood.earth'

  it('matches /a=<token> and redirects to /welcome', () => {
    const r = handleQrAttribution(new URL('https://pay.commongood.earth/a=cge2606'), undefined, domain)
    expect(r).not.toBeNull()
    expect(r!.headers.get('Location')).toBe('/welcome')
    expect(r!.headers.get('Set-Cookie')).toContain('ad=a%3Acge2606')
    expect(r!.headers.get('Set-Cookie')).toContain('Domain=.commongood.earth')
  })

  it('matches /q=<token> (company) and redirects to /welcome', () => {
    const r = handleQrAttribution(new URL('https://pay.commongood.earth/q=NEWABE'), undefined, domain)
    expect(r!.headers.get('Location')).toBe('/welcome')
    expect(r!.headers.get('Set-Cookie')).toContain('ad=q%3ANEWABE')
  })

  it('matches /w=<token> and redirects to commongood.earth', () => {
    const r = handleQrAttribution(new URL('https://pay.commongood.earth/w=card2606'), undefined, domain)
    expect(r!.headers.get('Location')).toBe('https://commongood.earth')
    expect(r!.headers.get('Set-Cookie')).toContain('ad=w%3Acard2606')
  })

  it('accepts hyphenated tokens like cge2606-whycg', () => {
    const r = handleQrAttribution(new URL('https://pay.commongood.earth/a=cge2606-whycg'), undefined, domain)
    expect(r).not.toBeNull()
    expect(r!.headers.get('Set-Cookie')).toContain('a%3Acge2606-whycg')
  })

  it('accumulates onto an existing ad cookie', () => {
    const r = handleQrAttribution(new URL('https://pay.commongood.earth/w=card2606'), 'a:cge2606', domain)
    expect(r!.headers.get('Set-Cookie')).toContain('ad=a%3Acge2606%20w%3Acard2606')
  })

  it('returns null for unrelated paths so the normal route handler runs', () => {
    expect(handleQrAttribution(new URL('https://pay.commongood.earth/welcome'), undefined, domain)).toBeNull()
    expect(handleQrAttribution(new URL('https://pay.commongood.earth/signup'), undefined, domain)).toBeNull()
    expect(handleQrAttribution(new URL('https://pay.commongood.earth/'), undefined, domain)).toBeNull()
  })

  it('rejects an unknown prefix letter', () => {
    expect(handleQrAttribution(new URL('https://pay.commongood.earth/x=foo'), undefined, domain)).toBeNull()
  })

  it('rejects an empty token', () => {
    expect(handleQrAttribution(new URL('https://pay.commongood.earth/a='), undefined, domain)).toBeNull()
  })

  it('rejects a token that is too long', () => {
    const tooLong = 'a=' + 'x'.repeat(200)
    expect(handleQrAttribution(new URL('https://pay.commongood.earth/' + tooLong), undefined, domain)).toBeNull()
  })

  it('sets HttpOnly + Secure + SameSite=Lax + Max-Age on the cookie', () => {
    const r = handleQrAttribution(new URL('https://pay.commongood.earth/a=cge2606'), undefined, domain)
    const setCookie = r!.headers.get('Set-Cookie')!
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('Secure')
    expect(setCookie).toContain('SameSite=Lax')
    expect(setCookie).toMatch(/Max-Age=\d+/)
  })
})
