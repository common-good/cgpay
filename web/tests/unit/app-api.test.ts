import { describe, it, expect, beforeEach, vi } from 'vitest'

const privateEnvState = { PHP_SSO_SECRET: 'test-secret' }
const publicEnvState: Record<string, string> = { PUBLIC_PHP_BASE_URL: 'https://demo.example/cgmembers', PUBLIC_APP_URL: 'http://localhost:5183' }
vi.mock('$env/dynamic/private', () => ({ get env() { return privateEnvState } }))
vi.mock('$env/dynamic/public', () => ({ get env() { return publicEnvState } }))

const { appCall } = await import('../../src/lib/server/app-api')
const { appCors, appBack } = await import('../../src/lib/server/app-cors')

const post = (body: unknown) => new Request('https://pay.example/api/app/signin', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) })
const reply = (status: number, body: unknown) => vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))

describe('appCall', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it('passes on only the named fields, plus the address', async () => {
    const f = global.fetch = reply(200, { token: 't' })
    const r = await appCall('signin', post({ identifier: 'a', password: 'p', evil: 'x', label: { no: 1 } }), '1.2.3.4', ['identifier', 'password', 'label'])
    expect(r).toEqual({ status: 200, data: { token: 't' } })
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ ip: '1.2.3.4', identifier: 'a', password: 'p' })
    expect(f.mock.calls[0][0]).toContain('/cgpay/app-signin')
  })

  it('adds the transaction API address to the device credentials', async () => {
    global.fetch = reply(200, { uid: 1, device: { accountId: 'K6A' } })
    expect((await appCall('device', post({ token: 't' }), '1.1.1.1', ['token'])).data).toEqual({ uid: 1, device: { accountId: 'K6A', api: 'https://demo.example/cgmembers/api/' } })
  })

  it('shows only the error code PHP gave, with its status', async () => {
    global.fetch = reply(401, { error: 'bad-login', secret: 'x' })
    expect(await appCall('signin', post({}), '1.1.1.1', [])).toEqual({ status: 401, data: { error: 'bad-login' } })
  })

  it('maps any other failure to a bad gateway without internals', async () => {
    global.fetch = reply(500, 'PHP fatal at /srv/secret/path.php')
    expect(await appCall('signin', post({}), '1.1.1.1', [])).toEqual({ status: 502, data: { error: 'failed' } })
  })

  it('says unavailable when PHP cannot be reached', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(await appCall('device', post({}), '1.1.1.1', [])).toEqual({ status: 502, data: { error: 'unavailable' } })
  })

  it('refuses a body that is not JSON', async () => {
    expect((await appCall('device', post('nope'), '1.1.1.1', [])).status).toBe(400)
  })

  it('limits sign-in attempts per address', async () => {
    global.fetch = reply(401, { error: 'bad-login' })
    const rs = []
    for (let i = 0; i < 7; i++) rs.push((await appCall('signin', post({}), '9.9.9.9', [], true)).status)
    expect(rs).toContain(429)
  })
})

describe('appCors', () => {
  const req = (origin: string | null, method = 'POST') => new Request('https://pay.example/api/app/signin', { method, headers: origin ? { origin } : {} })

  it.each(['https://localhost', 'capacitor://localhost', 'http://localhost:5183'])('allows %s', o => {
    const res = appCors(req(o), new Response('{}'))
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(o)
  })

  it('gives other origins no CORS headers, and refuses their preflight', () => {
    expect(appCors(req('https://evil.example'), new Response('{}')).headers.get('Access-Control-Allow-Origin')).toBeNull()
    expect(appCors(req('https://evil.example', 'OPTIONS'), new Response(null, { status: 204 })).status).toBe(403)
  })

  it('answers an allowed preflight', () => {
    const res = appCors(req('https://localhost', 'OPTIONS'), new Response(null, { status: 204 }))
    expect(res.status).toBe(204)
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST')
  })
})

describe('appBack', () => {
  it.each(['https://localhost/', 'capacitor://localhost/', 'http://localhost:5183/'])('goes back to the app at %s', back => expect(appBack(back)).toBe(back))
  it.each(['https://evil.example/', 'https://localhost.evil.example/', 'capacitor://localhostx/', ''])('goes nowhere else (%s)', back => expect(appBack(back)).toBe('/'))
})
