// Minimal in-memory rate limiter — fine for a single-instance staging deployment.
// Move to Redis (or a sticky-session approach) before this runs on multiple instances.

type Bucket = { hits: number[]; blockedUntil: number }
const buckets = new Map<string, Bucket>()

const MAX_HITS = 5         // attempts allowed per window
const WINDOW_MS = 60_000   // rolling 60s window
const BLOCK_MS = 5 * 60_000 // 5 min block after threshold

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number }

export function rateLimit(key: string, now: number = Date.now()): RateLimitResult {
  let b = buckets.get(key)
  if (!b) {
    b = { hits: [], blockedUntil: 0 }
    buckets.set(key, b)
  }

  if (b.blockedUntil > now) {
    return { ok: false, retryAfterSec: Math.ceil((b.blockedUntil - now) / 1000) }
  }

  // Trim hits outside the window
  b.hits = b.hits.filter(t => t > now - WINDOW_MS)
  b.hits.push(now)

  if (b.hits.length > MAX_HITS) {
    b.blockedUntil = now + BLOCK_MS
    b.hits = []
    return { ok: false, retryAfterSec: Math.ceil(BLOCK_MS / 1000) }
  }

  return { ok: true }
}
