import { describe, it, expect, vi, beforeEach } from 'vitest'

const kv = new Map<string, unknown>()
let cap = Infinity // how many entries the phone has room for
vi.mock('../../app/src/storage', () => ({
  store: {
    get: async (k: string) => kv.get(k),
    set: async (k: string, v: unknown) => { if (!kv.has(k) && kv.size >= cap) throw new Error('full'); kv.set(k, v) },
    del: async (k: string) => { kv.delete(k) },
    all: async (p: string) => [...kv].filter(([k]) => k.startsWith(p)).sort(([a], [b]) => a < b ? -1 : 1),
    keys: async (p: string) => [...kv.keys()].filter(k => k.startsWith(p)).sort()
  }
}))

const { cachePhoto, cacheProfile, dropUnused, enqueue, flush, offlinePhoto, waiting } = await import('../../app/src/lib/tx')
const { identity, unreachable } = await import('../../app/src/lib/api')
const { parseQr } = await import('../../app/src/lib/qr')

const d = { api: 'https://x/api/', deviceId: 'dev', accountId: 'NEWZPC0abc' } as any
const card = { acct: 'NEWZPD', main: 'NEWZPD', code: 'xyz' }
const tx = (n: number) => ({ actorId: 'A', otherId: 'B', amount: '1.00', description: 'x', created: n, proof: `proof${n}`, deviceId: 'dev', offline: true, pending: false, version: 40206 })
const reply = (body: string, status = 200) => new Response(body, { status })
const answer = (...bodies: (string | (() => Promise<Response>))[]) => {
  const f = vi.fn(async () => { const b = bodies.shift() ?? '{"ok":true}'; return typeof b === 'string' ? reply(b) : b() })
  vi.stubGlobal('fetch', f)
  return f
}

beforeEach(() => { kv.clear(); cap = Infinity; vi.unstubAllGlobals() })

describe('unreachable', () => {
  it('is true only when no answer came', () => {
    expect(unreachable(new TypeError('Failed to fetch'))).toBe(true)
    expect(unreachable(new DOMException('slow', 'TimeoutError'))).toBe(true)
    expect(unreachable(new SyntaxError('Unexpected token <'))).toBe(false)
    expect(unreachable(new Error('404'))).toBe(false)
  })
})

describe('identity', () => {
  it('fails as a server error, not as offline, when the answer is an error page or has no limit', async () => {
    for (const b of ['<html>Fatal error</html>', '{"name":"Dee"}']) {
      answer(b)
      const er = await identity(d, card).catch(e => e)
      expect(er.message).toBe('502')
      expect(unreachable(er)).toBe(false)
    }
  })
  it('returns the limit as a number', async () => {
    answer('{"name":"Dee","limit":"12.5"}')
    expect((await identity(d, card)).limit).toBe(12.5)
  })
})

describe('flush', () => {
  it('deletes a queued transaction only on a clear yes, and keeps it with the reason otherwise', async () => {
    for (const [i, t] of [1, 2, 3, 4].entries()) kv.set(`tx:${i}`, tx(t))
    answer('{"ok":true}', '<html>Fatal error</html>', '{"ok":false,"message":"no funds"}', '{}')
    expect(await flush(d)).toBe(false)
    expect([...kv.entries()].map(([k, v]) => [k, (v as any).error])).toEqual([['tx:1', '502'], ['tx:2', 'no funds'], ['tx:3', 'refused']])
    expect(await waiting()).toBe(0)
  })
  it('keeps everything and says so when there is no connection', async () => {
    kv.set('tx:0', tx(0))
    answer(async () => { throw new TypeError('Failed to fetch') })
    expect(await flush(d)).toBe(true)
    expect(await waiting()).toBe(1)
  })
  it('never sends a transaction twice when called again during a run', async () => {
    kv.set('tx:0', tx(0))
    let release = () => {}
    const f = answer(() => new Promise(ok => release = () => ok(reply('{"ok":true}'))))
    const runs = [flush(d), flush(d), flush(d)]
    await vi.waitFor(() => expect(f).toHaveBeenCalledTimes(1))
    kv.set('tx:1', tx(1)) // queued during the run: the next run sends it
    release()
    await Promise.all(runs)
    expect(f).toHaveBeenCalledTimes(2)
    expect(kv.size).toBe(0)
  })
})

describe('out of space', () => {
  const who = { name: 'Dee', agent: '', location: '', limit: 1, selling: [], isell: [] }
  const keep = (...acctTs: [string, number][]) => { for (const [a, t] of acctTs) { kv.set(`acct:test:${a}`, { who, h: '', t }); kv.set(`photo:test:${a}`, { src: '', h: '' }) } }
  it('forgets the two least recently used accounts kept (profile and photo) to keep a transaction', async () => {
    keep(['A', 3], ['B', 1], ['C', 4], ['D', 2])
    cap = 8
    await enqueue(tx(1))
    expect([...kv.keys()].sort()).toEqual(['acct:test:A', 'acct:test:C', 'photo:test:A', 'photo:test:C', 'tx:1:proof1'])
  })
  it('counts a profile as used when a transaction with it is accepted, unless it was seen online later', async () => {
    kv.set('acct:test:B', { who, h: '', t: 5000 }); kv.set('acct:test:C', { who, h: '', t: 1000 })
    kv.set('tx:9', { ...tx(3), otherId: 'B' }); kv.set('tx:8', { ...tx(2), otherId: 'C' })
    answer('{"ok":true}', '{"ok":true}')
    await flush(d)
    expect([(kv.get('acct:test:B') as any).t, (kv.get('acct:test:C') as any).t]).toEqual([5000, 2000])
  })
  it('fails when there is still no room, so the transaction is not taken for kept', async () => {
    cap = 0
    await expect(enqueue(tx(1))).rejects.toThrow()
  })
  it('never fails a scan for want of room to keep the profile', async () => {
    cap = 0
    await expect(cacheProfile(card, who)).resolves.toBeUndefined()
    expect(kv.size).toBe(0)
  })
})

describe('offline photos', () => {
  const who = { name: 'Dee', agent: '', location: '', limit: 1, selling: [], isell: [] }, other = { ...card, code: 'other' }
  const day = 86_400_000, now = 1000 * day
  it('come back only for the card code they were kept with', async () => {
    await cachePhoto(card, 'data:x')
    expect(await offlinePhoto(card)).toBe('data:x')
    expect(await offlinePhoto(other)).toBe('')
  })
  it('are kept per env', async () => {
    await cachePhoto(card, 'data:x')
    vi.stubGlobal('localStorage', { getItem: () => 'demo' })
    expect(await offlinePhoto(card)).toBe('')
  })
  it('go with their profiles when not used for a year, checked at most once a day', async () => {
    kv.set('acct:test:A', { who, h: '', t: now - 366 * day }); kv.set('acct:test:B', { who, h: '', t: now - 364 * day })
    for (const a of 'ABC') kv.set(`photo:test:${a}`, { src: '', h: '' }) // C has no profile any more
    await dropUnused(now)
    expect([...kv.keys()].filter(k => !k.startsWith('unused')).sort()).toEqual(['acct:test:B', 'photo:test:B'])
    kv.set('photo:test:A', { src: '', h: '' })
    await dropUnused(now + day / 2)
    expect(kv.has('photo:test:A')).toBe(true)
  })
})

describe('parseQr', () => {
  it('takes an address part in lowercase, keeping the card code as it is', () => {
    expect(parseQr('http://6vm.rc4.me/KDJJ34kjdfKJ4', false)).toEqual(parseQr('HTTP://6VM.RC4.ME/KDJJ34kjdfKJ4', false))
    expect(() => parseQr('HTTP://6VM.RC4.ME/kdjj34', false)).toThrow()
  })
})
