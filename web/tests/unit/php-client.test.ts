import { describe, it, expect, beforeEach, vi } from 'vitest'

// Stub the env module so we can flip config per test.
const envState = { PHP_SSO_URL: '', PHP_GRANTS_URL: '', PHP_SSO_SECRET: '' }
vi.mock('$env/dynamic/private', () => ({
  get env() { return envState }
}))

// Import after mocks so `env` gets the stubbed value.
const { callPhp, PhpCallError } = await import('../../src/lib/server/php-client')

describe('callPhp', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    envState.PHP_SSO_URL = 'https://demo.example/cgpay-sso'
    envState.PHP_GRANTS_URL = 'https://demo.example/cgpay-grants'
    envState.PHP_SSO_SECRET = 'test-secret'
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('throws PhpCallError(not_configured) when PHP_SSO_URL is missing', async () => {
    envState.PHP_SSO_URL = ''
    const err = await callPhp('/cgpay-whoami').catch(e => e)
    expect(err).toBeInstanceOf(PhpCallError)
    expect(err.kind).toBe('not_configured')
    expect(err.message).toMatch(/PHP_SSO_URL/)
  })

  it('throws PhpCallError(not_configured) when PHP_SSO_SECRET is missing', async () => {
    envState.PHP_SSO_SECRET = ''
    const err = await callPhp('/cgpay-whoami').catch(e => e)
    expect(err).toBeInstanceOf(PhpCallError)
    expect(err.kind).toBe('not_configured')
  })

  it('throws PhpCallError(not_configured) when the base URL is malformed', async () => {
    envState.PHP_SSO_URL = 'not a url at all'
    const err = await callPhp('/cgpay-whoami').catch(e => e)
    expect(err).toBeInstanceOf(PhpCallError)
    expect(err.kind).toBe('not_configured')
  })

  it('honors baseUrlEnv when set to PHP_GRANTS_URL', async () => {
    let calledUrl = ''
    global.fetch = vi.fn(async (url: string) => {
      calledUrl = url
      return new Response(JSON.stringify({ ok: 1 }), { status: 200 })
    }) as unknown as typeof fetch
    await callPhp('/cgpay-grants', { baseUrlEnv: 'PHP_GRANTS_URL' })
    expect(calledUrl).toBe('https://demo.example/cgpay-grants')
  })

  it('sends the shared-secret header + JSON body on POST', async () => {
    let received: { url: string; init: RequestInit } | null = null
    global.fetch = vi.fn(async (url: string, init: RequestInit) => {
      received = { url, init }
      return new Response(JSON.stringify({ ok: 1 }), { status: 200 })
    }) as unknown as typeof fetch
    await callPhp('/cgpay-whoami', { method: 'POST', body: { ssid: 'abc' } })
    expect(received!.init.method).toBe('POST')
    expect((received!.init.headers as Record<string, string>)['x-cg-internal-token']).toBe('test-secret')
    expect((received!.init.headers as Record<string, string>)['content-type']).toBe('application/json')
    expect(JSON.parse(received!.init.body as string)).toEqual({ ssid: 'abc' })
  })

  it('appends query params on GET', async () => {
    let calledUrl = ''
    global.fetch = vi.fn(async (url: string) => {
      calledUrl = url
      return new Response(JSON.stringify({ ok: 1 }), { status: 200 })
    }) as unknown as typeof fetch
    await callPhp('/cgpay-people-autocomplete', {
      method: 'GET',
      query: { uid: 42, q: 'ada', limit: 20 }
    })
    expect(calledUrl).toBe('https://demo.example/cgpay-people-autocomplete?uid=42&q=ada&limit=20')
  })

  it('returns {ok:true, data} on a successful JSON response', async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ hello: 'world' }), { status: 200 })) as unknown as typeof fetch
    const result = await callPhp<{ hello: string }>('/x')
    expect(result).toEqual({ ok: true, data: { hello: 'world' } })
  })

  it('returns {ok:false, status, body} on an HTTP error with parseable body', async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ error: 'bad' }), { status: 400 })) as unknown as typeof fetch
    const result = await callPhp('/x')
    expect(result).toEqual({ ok: false, status: 400, body: { error: 'bad' } })
  })

  it('returns {ok:false, status, raw text body} on an HTTP error with non-JSON body', async () => {
    global.fetch = vi.fn(async () => new Response('nginx error page', { status: 502 })) as unknown as typeof fetch
    const result = await callPhp('/x')
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.status).toBe(502)
      expect(result.body).toBe('nginx error page')
    }
  })

  it('throws PhpCallError(network) when fetch rejects', async () => {
    global.fetch = vi.fn(async () => { throw new Error('ECONNREFUSED') }) as unknown as typeof fetch
    const err = await callPhp('/x').catch(e => e)
    expect(err).toBeInstanceOf(PhpCallError)
    expect(err.kind).toBe('network')
  })

  it('throws PhpCallError(bad_response) when a 200 body is non-JSON', async () => {
    global.fetch = vi.fn(async () => new Response('<html>oops</html>', { status: 200 })) as unknown as typeof fetch
    const err = await callPhp('/x').catch(e => e)
    expect(err).toBeInstanceOf(PhpCallError)
    expect(err.kind).toBe('bad_response')
  })

  it('throws PhpCallError(bad_response) when a 200 body is literal null', async () => {
    global.fetch = vi.fn(async () => new Response('null', { status: 200 })) as unknown as typeof fetch
    const err = await callPhp('/x').catch(e => e)
    expect(err).toBeInstanceOf(PhpCallError)
    expect(err.kind).toBe('bad_response')
  })

  it('throws PhpCallError(bad_response) on an empty 200 body', async () => {
    global.fetch = vi.fn(async () => new Response('', { status: 200 })) as unknown as typeof fetch
    const err = await callPhp('/x').catch(e => e)
    expect(err).toBeInstanceOf(PhpCallError)
    expect(err.kind).toBe('bad_response')
  })
})
