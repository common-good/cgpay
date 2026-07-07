import { describe, it, expect } from 'vitest'
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
