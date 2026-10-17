import { describe, it, expect, beforeEach, vi } from 'vitest'

// Stub both private and public env modules so we can flip config per test.
const privateEnvState = { PHP_SSO_SECRET: '' }
const publicEnvState = { PUBLIC_PHP_BASE_URL: '' }
vi.mock('$env/dynamic/private', () => ({
  get env() { return privateEnvState }
}))
vi.mock('$env/dynamic/public', () => ({
  get env() { return publicEnvState }
}))

// Import after mocks so `env` gets the stubbed values.
const { callPhp, PhpCallError } = await import('../../src/lib/server/php-client')

describe('callPhp', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    publicEnvState.PUBLIC_PHP_BASE_URL = 'https://demo.example/cg/cgmembers'
    privateEnvState.PHP_SSO_SECRET = 'test-secret'
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('throws PhpCallError(not_configured) when PHP_SSO_SECRET is missing', async () => {
    privateEnvState.PHP_SSO_SECRET = ''
    const err = await callPhp('/cgpay/whoami').catch(e => e)
    expect(err).toBeInstanceOf(PhpCallError)
    expect(err.kind).toBe('not_configured')
  })

  it('throws PhpCallError(not_configured) when PUBLIC_PHP_BASE_URL is missing', async () => {
    publicEnvState.PUBLIC_PHP_BASE_URL = ''
    const err = await callPhp('/cgpay/whoami').catch(e => e)
    expect(err).toBeInstanceOf(PhpCallError)
    expect(err.kind).toBe('not_configured')
  })

  it('resolves endpoints against the base URL, preserving a multi-segment base path', async () => {
    let calledUrl = ''
    global.fetch = vi.fn(async (url: string) => {
      calledUrl = url
      return new Response(JSON.stringify({ ok: 1 }), { status: 200 })
    }) as unknown as typeof fetch
    await callPhp('/cgpay/whoami')
    expect(calledUrl).toBe('https://demo.example/cg/cgmembers/cgpay/whoami')
  })

  it('resolves cgpay/grants against the same base URL (no separate env var)', async () => {
    let calledUrl = ''
    global.fetch = vi.fn(async (url: string) => {
      calledUrl = url
      return new Response(JSON.stringify({ ok: 1 }), { status: 200 })
    }) as unknown as typeof fetch
    await callPhp('/cgpay/grants')
    expect(calledUrl).toBe('https://demo.example/cg/cgmembers/cgpay/grants')
  })

  it('sends the shared-secret header + JSON body on POST', async () => {
    let received: { url: string; init: RequestInit } | null = null
    global.fetch = vi.fn(async (url: string, init: RequestInit) => {
      received = { url, init }
      return new Response(JSON.stringify({ ok: 1 }), { status: 200 })
    }) as unknown as typeof fetch
    await callPhp('/cgpay/whoami', { method: 'POST', body: { ssid: 'abc' } })
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
    await callPhp('/cgpay/people-autocomplete', {
      method: 'GET',
      query: { uid: 42, search: 'ada', limit: 20 }
    })
    expect(calledUrl).toBe('https://demo.example/cg/cgmembers/cgpay/people-autocomplete?uid=42&search=ada&limit=20')
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
