import { describe, it, expect, vi } from 'vitest'

const kv = new Map<string, unknown>()
vi.mock('../../app/src/storage', () => ({ store: { get: async (k: string) => kv.get(k), set: async (k: string, v: unknown) => { kv.set(k, v) } } }))
const { now, clockOff, loadClock, setClock } = await import('../../app/src/lib/clock')

describe('clock', () => {
  it('takes the server time, says how far off the phone is, and keeps the difference for the next start', async () => {
    const H = 3600_000
    await setClock(Date.now() + 2 * H, Date.now())
    expect(clockOff()).toBe(120)
    expect(Math.abs(now() - (Date.now() + 2 * H))).toBeLessThan(1000)
    await setClock(Date.now() + 60_000, Date.now())
    expect(clockOff()).toBe(0) // a minute off does not matter
    kv.set('clockOffset', -3 * H)
    await loadClock()
    expect(clockOff()).toBe(-180)
  })
})
