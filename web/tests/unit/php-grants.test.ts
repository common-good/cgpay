import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the $env/dynamic/private import so we can flip config on/off per test.
const envState = { PHP_GRANTS_URL: '', PHP_SSO_SECRET: '' }

vi.mock('$env/dynamic/private', () => ({
  get env() { return envState }
}))

// Import after mocks — Vitest hoists vi.mock so this is safe.
const { listGrants, createGrant, PhpGrantError } = await import('../../src/lib/server/php-grants')

describe('php-grants client', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    envState.PHP_GRANTS_URL = 'https://demo.example/cgpay-grants'
    envState.PHP_SSO_SECRET = 'test-secret'
    global.fetch = originalFetch
  })

  it('throws when PHP_GRANTS_URL is not configured', async () => {
    envState.PHP_GRANTS_URL = ''
    await expect(listGrants(1)).rejects.toThrow(/not configured/)
  })

  it('throws when PHP_SSO_SECRET is not configured', async () => {
    envState.PHP_SSO_SECRET = ''
    await expect(listGrants(1)).rejects.toThrow(/not configured/)
  })

  it('listGrants sends the shared-secret header and uid query param', async () => {
    const calls: { url: string; init: RequestInit }[] = []
    global.fetch = vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init })
      return new Response(JSON.stringify({ grants: [] }), { status: 200 })
    }) as unknown as typeof fetch

    await listGrants(42)

    expect(calls).toHaveLength(1)
    expect(calls[0].url).toBe('https://demo.example/cgpay-grants?uid=42')
    expect((calls[0].init.headers as Record<string, string>)['x-cg-internal-token']).toBe('test-secret')
  })

  it('listGrants surfaces a PhpGrantError with the response status on non-2xx', async () => {
    global.fetch = vi.fn(async () => new Response('nope', { status: 403 })) as unknown as typeof fetch

    const err = await listGrants(1).catch(e => e)
    expect(err).toBeInstanceOf(PhpGrantError)
    expect(err.status).toBe(403)
  })

  it('createGrant POSTs JSON body and returns the new id', async () => {
    let received: { url: string; init: RequestInit } | null = null
    global.fetch = vi.fn(async (url: string, init: RequestInit) => {
      received = { url, init }
      return new Response(JSON.stringify({ id: 99 }), { status: 200 })
    }) as unknown as typeof fetch

    const id = await createGrant({ uid: 5, amount: 500, by: 'ach', fullName: 'A Donor' })

    expect(id).toBe(99)
    expect(received!.url).toBe('https://demo.example/cgpay-grants')
    expect(received!.init.method).toBe('POST')
    const body = JSON.parse(received!.init.body as string)
    expect(body).toMatchObject({ uid: 5, amount: 500, by: 'ach', fullName: 'A Donor' })
  })

  it('createGrant surfaces PhpGrantError with the PHP error string on 400', async () => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ error: 'bad amount' }), { status: 400 })) as unknown as typeof fetch

    const err = await createGrant({ uid: 1, amount: -1, by: 'ach', fullName: 'X' }).catch(e => e)
    expect(err).toBeInstanceOf(PhpGrantError)
    expect(err.status).toBe(400)
    expect(err.message).toContain('bad amount')
  })
})
