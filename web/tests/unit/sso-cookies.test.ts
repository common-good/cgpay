import { describe, it, expect, beforeEach, vi } from 'vitest'

const privateEnv: Record<string, string | undefined> = {}
const publicEnv: Record<string, string | undefined> = {}
vi.mock('$env/dynamic/private', () => ({ get env() { return privateEnv } }))
vi.mock('$env/dynamic/public', () => ({ get env() { return publicEnv } }))

const { legacyDomains, setSsoCookie, setSsoCookies, clearSsoCookie, cookieValues, healSsoCookies } = await import('../../src/lib/server/sso-cookies')

type Call = { op: 'set' | 'delete'; name: string; value?: string; domain?: string; path?: string }
const jar = () => {
  const calls: Call[] = []
  const cookies = {
    set: (name: string, value: string, o: { domain?: string; path?: string }) => calls.push({ op: 'set', name, value, domain: o.domain, path: o.path }),
    delete: (name: string, o: { domain?: string; path?: string }) => calls.push({ op: 'delete', name, domain: o.domain, path: o.path })
  }
  return { calls, cookies: cookies as never }
}
const NAME = 'SSESSabc'

beforeEach(() => {
  publicEnv.PUBLIC_PHP_BASE_URL = 'https://test.commongood.earth'
  privateEnv.PHP_SSO_COOKIE_NAME = NAME
})

describe('legacyDomains', () => {
  it('is the parent of the PHP host', () => {
    expect(legacyDomains('.test.commongood.earth')).toEqual(['.commongood.earth'])
    expect(legacyDomains('.pay.test.commongood.earth')).toEqual(['.commongood.earth'])
  })
  it('is empty when there is no parent to leave behind', () => {
    expect(legacyDomains('localhost')).toEqual([])
    expect(legacyDomains('127.0.0.1')).toEqual([])
    expect(legacyDomains('.commongood.earth')).toEqual([])
  })
})

describe('writing and clearing', () => {
  it('a set writes the current scope first, then expires every legacy scope of the same name', () => {
    const { calls, cookies } = jar()
    setSsoCookie(cookies, NAME, 'v1')
    expect(calls).toEqual([
      { op: 'set', name: NAME, value: 'v1', domain: '.test.commongood.earth', path: '/' },
      { op: 'delete', name: NAME, domain: '.commongood.earth', path: '/' }
    ])
  })
  it('the device cookie gets the same treatment, and only when both its name and value are there', () => {
    const a = jar()
    setSsoCookies(a.cookies, { cookieName: NAME, ssid: 's', boxCookieName: 'box-X', boxCookieValue: 'b' })
    expect(a.calls.map(c => `${c.op} ${c.name} ${c.domain}`)).toEqual([
      `set ${NAME} .test.commongood.earth`, `delete ${NAME} .commongood.earth`,
      'set box-X .test.commongood.earth', 'delete box-X .commongood.earth'
    ])
    const b = jar()
    setSsoCookies(b.cookies, { cookieName: NAME, ssid: 's' })
    expect(b.calls.length).toBe(2)
  })
  it('a clear expires the current scope and every legacy scope', () => {
    const { calls, cookies } = jar()
    clearSsoCookie(cookies)
    expect(calls.map(c => `${c.op} ${c.name} ${c.domain}`)).toEqual([`delete ${NAME} .test.commongood.earth`, `delete ${NAME} .commongood.earth`])
  })
  it('on localhost there is nothing legacy to expire', () => {
    publicEnv.PUBLIC_PHP_BASE_URL = 'http://localhost/cg/cgmembers'
    const { calls, cookies } = jar()
    setSsoCookie(cookies, NAME, 'v')
    expect(calls.length).toBe(1)
  })
})

describe('cookieValues', () => {
  it('returns every value of the name, oldest first, and nothing for other names', () => {
    expect(cookieValues(`a=1; ${NAME}=old; b=2; ${NAME}=new; ${NAME}x=no`, NAME)).toEqual(['old', 'new'])
  })
  it('copes with a missing header and with values that are not URI-encoded', () => {
    expect(cookieValues(null, NAME)).toEqual([])
    expect(cookieValues(`${NAME}=%E0%A4%A`, NAME)).toEqual(['%E0%A4%A'])
  })
})

describe('healSsoCookies', () => {
  const header = `${NAME}=stale; ${NAME}=live`
  it('does nothing, and asks PHP nothing, for a single value', async () => {
    const { calls, cookies } = jar()
    const valid = vi.fn(async () => true)
    await healSsoCookies(cookies, `${NAME}=only`, valid)
    expect(calls).toEqual([])
    expect(valid).not.toHaveBeenCalled()
  })
  it('uses the first live value, writes it back at the current scope first, and expires the legacy scope', async () => {
    const { calls, cookies } = jar()
    await healSsoCookies(cookies, header, async v => v === 'live')
    expect(calls).toEqual([
      { op: 'set', name: NAME, value: 'live', domain: '.test.commongood.earth', path: '/' },
      { op: 'delete', name: NAME, domain: '.commongood.earth', path: '/' }
    ])
  })
  it('stops asking at the first live value', async () => {
    const valid = vi.fn(async () => true)
    await healSsoCookies(jar().cookies, `${NAME}=a; ${NAME}=b; ${NAME}=c`, valid)
    expect(valid).toHaveBeenCalledTimes(1)
  })
  it('with no live value, only expires the legacy scope', async () => {
    const { calls, cookies } = jar()
    await healSsoCookies(cookies, header, async () => false)
    expect(calls).toEqual([{ op: 'delete', name: NAME, domain: '.commongood.earth', path: '/' }])
  })
})

// SvelteKit's real cookie jar. It holds cookies written in a hook until the route is resolved (resolve(event) does that),
// so `routed()` stands for resolve before anything reads the cookie.
describe('with the real cookie jar', () => {
  const kitDir = new URL('../../node_modules/@sveltejs/kit/src/runtime/server/cookie.js', import.meta.url).href
  const jarFor = async (header: string) => {
    const { get_cookies } = await import(/* @vite-ignore */ kitDir)
    const url = new URL('https://pay.test.commongood.earth/')
    const j = get_cookies(new Request(url, { headers: { cookie: header } }), url)
    return { cookies: j.cookies, routed: () => j.set_trailing_slash('never') }
  }
  it('get() returns the live value after a heal, though the legacy expiry comes after it', async () => {
    const h = `${NAME}=stale; ${NAME}=live`
    const { cookies, routed } = await jarFor(h)
    expect(cookies.get(NAME)).toBe('stale')
    await healSsoCookies(cookies, h, async v => v === 'live')
    routed()
    expect(cookies.get(NAME)).toBe('live')
  })
  it('get() returns nothing after a heal that found no live value', async () => {
    const h = `${NAME}=a; ${NAME}=b`
    const { cookies, routed } = await jarFor(h)
    await healSsoCookies(cookies, h, async () => false)
    routed()
    expect(cookies.get(NAME)).toBeUndefined()
  })
})
