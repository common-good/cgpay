import { describe, it, expect, vi, afterEach } from 'vitest'
import { rateLimit } from '../../src/lib/server/rate-limit'

// The rate limiter uses an in-memory Map keyed by whatever string you pass, so
// isolate each test by giving every one a unique key. Same clock across a test
// (we pass explicit `now` values) so we can exercise the window boundaries
// deterministically.

describe('rateLimit', () => {
  it('lets the first 5 attempts through in a fresh window', () => {
    const key = 'first-5-through'
    const start = 1_000_000
    for (let i = 0; i < 5; i++) {
      const result = rateLimit(key, start + i * 1_000)
      expect(result.ok, `attempt ${i + 1}`).toBe(true)
    }
  })

  it('blocks the 6th attempt within the 60s window', () => {
    const key = 'sixth-blocked'
    const start = 2_000_000
    for (let i = 0; i < 5; i++) rateLimit(key, start + i * 1_000)
    const sixth = rateLimit(key, start + 5_000)
    expect(sixth.ok).toBe(false)
    if (!sixth.ok) expect(sixth.retryAfterSec).toBeGreaterThan(0)
  })

  it('remains blocked for the whole 5-minute lockout even if attempts stop', () => {
    const key = 'stays-blocked'
    const start = 3_000_000
    for (let i = 0; i < 6; i++) rateLimit(key, start + i * 1_000)
    // 4 minutes later — still blocked
    const midLockout = rateLimit(key, start + 4 * 60_000)
    expect(midLockout.ok).toBe(false)
  })

  it('unblocks after the 5-minute lockout expires', () => {
    const key = 'unblocks-later'
    const start = 4_000_000
    for (let i = 0; i < 6; i++) rateLimit(key, start + i * 1_000)
    // 5+ minutes later — should be OK again
    const past = rateLimit(key, start + 5 * 60_000 + 5_000)
    expect(past.ok).toBe(true)
  })

  it('does not conflate different keys', () => {
    const start = 5_000_000
    for (let i = 0; i < 5; i++) rateLimit('key-a', start + i * 1_000)
    expect(rateLimit('key-a', start + 5_000).ok).toBe(false)
    expect(rateLimit('key-b', start + 5_000).ok).toBe(true)
  })

  it('trims hits that have rolled out of the window', () => {
    const key = 'window-rolls'
    const start = 6_000_000
    // 4 attempts at time 0
    for (let i = 0; i < 4; i++) rateLimit(key, start + i * 1_000)
    // 65 seconds later — old hits should be trimmed, allowing new ones
    for (let i = 0; i < 5; i++) {
      expect(rateLimit(key, start + 65_000 + i * 1_000).ok, `re-attempt ${i + 1}`).toBe(true)
    }
  })
})

// The limiter reads E2E_RATE_LIMIT_MAX + NODE_ENV at import time. These tests
// mutate the env, reset the module cache, and dynamic-import so each case gets
// a fresh instance; the static import at the top of this file is unaffected.
describe('rateLimit E2E_RATE_LIMIT_MAX guard', () => {
  const originalEnv = { ...process.env }
  afterEach(() => {
    process.env = { ...originalEnv }
    vi.resetModules()
    vi.restoreAllMocks()
  })

  it('ignores E2E_RATE_LIMIT_MAX in production and warns once', async () => {
    process.env.NODE_ENV = 'production'
    process.env.E2E_RATE_LIMIT_MAX = '1000'
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.resetModules()
    const { rateLimit: prodLimit } = await import('../../src/lib/server/rate-limit')
    expect(warnSpy).toHaveBeenCalledOnce()
    expect(warnSpy.mock.calls[0][0]).toMatch(/E2E_RATE_LIMIT_MAX is set in production/)
    const start = 10_000_000
    for (let i = 0; i < 5; i++) {
      expect(prodLimit(`prod-guard-${i}`, start + i).ok, `prod attempt ${i + 1}`).toBe(true)
    }
    // 6th attempt on the SAME key should be blocked (limit is still 5, not 1000)
    for (let i = 0; i < 5; i++) prodLimit('prod-same-key', start + i)
    expect(prodLimit('prod-same-key', start + 5).ok).toBe(false)
  })

  it('honors E2E_RATE_LIMIT_MAX when NODE_ENV is not production', async () => {
    process.env.NODE_ENV = 'test'
    process.env.E2E_RATE_LIMIT_MAX = '20'
    vi.resetModules()
    const { rateLimit: testLimit } = await import('../../src/lib/server/rate-limit')
    const start = 11_000_000
    // Should allow 20 attempts (not block at 5)
    for (let i = 0; i < 20; i++) {
      expect(testLimit('test-override', start + i).ok, `attempt ${i + 1}`).toBe(true)
    }
    expect(testLimit('test-override', start + 20).ok).toBe(false)
  })

  it('falls back to default when E2E_RATE_LIMIT_MAX is not a positive number', async () => {
    process.env.NODE_ENV = 'test'
    process.env.E2E_RATE_LIMIT_MAX = 'not-a-number'
    vi.resetModules()
    const { rateLimit: badLimit } = await import('../../src/lib/server/rate-limit')
    const start = 12_000_000
    for (let i = 0; i < 5; i++) badLimit('bad-override', start + i)
    expect(badLimit('bad-override', start + 5).ok).toBe(false)
  })

  it('does not warn or override when E2E_RATE_LIMIT_MAX is unset', async () => {
    process.env.NODE_ENV = 'production'
    delete process.env.E2E_RATE_LIMIT_MAX
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.resetModules()
    const { rateLimit: cleanLimit } = await import('../../src/lib/server/rate-limit')
    expect(warnSpy).not.toHaveBeenCalled()
    const start = 13_000_000
    for (let i = 0; i < 5; i++) cleanLimit('clean-prod', start + i)
    expect(cleanLimit('clean-prod', start + 5).ok).toBe(false)
  })
})
