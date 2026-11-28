import { describe, it, expect, vi, beforeEach } from 'vitest'

const kv = new Map<string, unknown>()
vi.mock('../../app/src/storage', () => ({ store: { get: async (k: string) => kv.get(k), set: async (k: string, v: unknown) => { kv.set(k, v) } } }))
const { log, logText } = await import('../../app/src/lib/log')

beforeEach(() => kv.clear())

describe('log', () => {
  it('keeps the last 200 lines in order, even when added at once', async () => {
    await Promise.all(Array.from({ length: 205 }, (_, i) => log(`line ${i}`)))
    const lines = (await logText()).split('\n')
    expect(lines).toHaveLength(200)
    expect(lines[0]).toMatch(/Z line 5$/)
    expect(lines[199]).toMatch(/Z line 204$/)
  })
  it('cuts a long line short', async () => {
    await log('x'.repeat(500))
    expect((await logText()).length).toBe(25 + 300)
  })
})
