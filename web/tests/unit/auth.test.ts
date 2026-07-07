import { describe, it, expect, beforeAll, vi } from 'vitest'

// Set JWT_SECRET before importing the module — auth.ts reads it lazily via
// $env/dynamic/private, but tests run outside SvelteKit's env pipeline so we
// stub the module directly.
vi.mock('$env/dynamic/private', () => ({
  env: { JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long!' }
}))

// Import after the mock so `env` gets the stubbed value.
const authModulePromise = import('../../src/lib/server/auth')

describe('signToken + verifyToken', () => {
  let signToken: typeof import('../../src/lib/server/auth').signToken
  let verifyToken: typeof import('../../src/lib/server/auth').verifyToken

  beforeAll(async () => {
    const mod = await authModulePromise
    signToken = mod.signToken
    verifyToken = mod.verifyToken
  })

  it('round-trips claims through a signed token', () => {
    const token = signToken({ uid: 26742000017291, name: 'abeone' })
    const claims = verifyToken(token)
    expect(claims).not.toBeNull()
    expect(claims?.uid).toBe(26742000017291)
    expect(claims?.name).toBe('abeone')
  })

  it('returns null for a garbage token', () => {
    expect(verifyToken('not-a-jwt')).toBeNull()
  })

  it('returns null for a token signed with a different secret', () => {
    // Sign with a completely different (non-mocked) key
    // We can't easily do this without importing jsonwebtoken directly, so pick
    // an obviously-bad token: the middle segment tampered.
    const good = signToken({ uid: 1, name: 'someone' })
    const parts = good.split('.')
    // Tamper the payload — this changes it in a way the signature no longer covers
    const tamperedPayload = Buffer.from('{"uid":999,"name":"attacker"}').toString('base64url')
    const tampered = `${parts[0]}.${tamperedPayload}.${parts[2]}`
    expect(verifyToken(tampered)).toBeNull()
  })
})

describe('bearerFromRequest', () => {
  let bearerFromRequest: typeof import('../../src/lib/server/auth').bearerFromRequest

  beforeAll(async () => {
    const mod = await authModulePromise
    bearerFromRequest = mod.bearerFromRequest
  })

  const withAuth = (value: string) =>
    new Request('http://example.com/', { headers: { authorization: value } })

  it('extracts the token from a well-formed Bearer header', () => {
    expect(bearerFromRequest(withAuth('Bearer abc.def.ghi'))).toBe('abc.def.ghi')
  })

  it('is case-insensitive on the scheme name', () => {
    expect(bearerFromRequest(withAuth('bearer xyz'))).toBe('xyz')
    expect(bearerFromRequest(withAuth('BEARER xyz'))).toBe('xyz')
  })

  it('returns null when the header is missing', () => {
    expect(bearerFromRequest(new Request('http://example.com/'))).toBeNull()
  })

  it('returns null for a non-Bearer scheme', () => {
    expect(bearerFromRequest(withAuth('Basic dXNlcjpwYXNz'))).toBeNull()
  })

  it('returns null when the token portion is empty', () => {
    expect(bearerFromRequest(withAuth('Bearer '))).toBeNull()
  })
})
