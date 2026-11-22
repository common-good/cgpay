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

const { cachePhoto, cacheProfile, dropUnused, enqueue, flush, offlinePhoto, refusals, waiting } = await import('../../app/src/lib/tx')
const { identity, unreachable } = await import('../../app/src/lib/api')
const { parseQr } = await import('../../app/src/lib/qr')

const d = { accountId: 'L6VMDCC0' } as any
const card = { acct: 'NEWZPD', main: 'NEWZPD', code: 'xyz' }
const tx = (n: number) => ({ actorId: 'A', otherId: 'B', amount: '1.00', description: 'x', created: n, proof: `proof${n}`, offline: true, pending: false })
const reply = (body: string, status = 200) => new Response(body, { status })
type Answer = string | [string, number] | (() => Promise<Response>)
const answer = (...bodies: Answer[]) => {
  const f = vi.fn(async (_url: string, _init: RequestInit) => { const b = bodies.shift() ?? '{"ok":true}'; return typeof b === 'string' ? reply(b) : Array.isArray(b) ? reply(...b) : b() })
  vi.stubGlobal('fetch', f)
  return f
}

beforeEach(() => { kv.clear(); cap = Infinity; kv.set('secure:token', 'test.tok'); vi.unstubAllGlobals() })

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
  it('asks the live site with the token, as the account acting, about the card scanned', async () => {
    const f = answer('{"limit":1}')
    await identity(d, card)
    expect(f.mock.calls[0][0]).toMatch(/\/api\/app\/identity$/)
    expect(JSON.parse(f.mock.calls[0][1].body as string)).toEqual({ token: 'test.tok', actorId: 'L6VMDCC0', otherId: 'NEWZPDxyz' })
  })
  it('fails with the status when the server refuses', async () => {
    answer(['{"error":"failed"}', 404])
    expect((await identity(d, card).catch(e => e)).message).toBe('404')
  })
})

describe('flush', () => {
  it('deletes a queued transaction on a clear yes, marks it with the reason when the server refuses it, and keeps it to send again on anything else (a fault, an error page)', async () => {
    for (const [i, t] of [1, 2, 3, 4, 5, 6].entries()) kv.set(`tx:${i}`, tx(t))
    answer('{"ok":true}', ['{"error":"failed"}', 502], '{"ok":false,"message":"no funds"}', '{}', ['{"error":"bad-request","message":"bad proof"}', 400], ['{"error":"bad-actor"}', 403])
    expect(await flush()).toBe(false)
    const errs = [...kv.entries()].filter(([k]) => k.startsWith('tx:')).map(([k, v]) => [k, (v as any).error])
    expect(errs).toEqual([['tx:1', undefined], ['tx:2', 'no funds'], ['tx:3', undefined], ['tx:4', 'bad proof'], ['tx:5', 'bad-actor']])
    expect(await waiting()).toBe(2)
  })
  it('sends each transaction with the token to the live site', async () => {
    kv.set('tx:0', tx(0))
    const f = answer('{"ok":true}')
    await flush()
    expect(f.mock.calls[0][0]).toMatch(/\/api\/app\/tx$/)
    expect(JSON.parse(f.mock.calls[0][1].body as string)).toEqual({ token: 'test.tok', ...tx(0) })
  })
  it.each<[string, Answer]>([
    ['there is no connection', async () => { throw new TypeError('Failed to fetch') }],
    ['the sign-in no longer works', ['{"error":"bad-token"}', 401]],
    ['the live site cannot reach its own server', ['{"error":"unavailable"}', 502]]
  ])('keeps everything, unmarked, and says so when %s', async (_, a) => {
    kv.set('tx:0', tx(0)); kv.set('tx:1', tx(1))
    const f = answer(a)
    expect(await flush()).toBe(true)
    expect(f).toHaveBeenCalledTimes(1)
    expect(await waiting()).toBe(2)
  })
  it('never sends a transaction twice when called again during a run', async () => {
    kv.set('tx:0', tx(0))
    let release = () => {}
    const f = answer(() => new Promise(ok => release = () => ok(reply('{"ok":true}'))))
    const runs = [flush(), flush(), flush()]
    await vi.waitFor(() => expect(f).toHaveBeenCalledTimes(1))
    kv.set('tx:1', tx(1)) // queued during the run: the next run sends it
    release()
    await Promise.all(runs)
    expect(f).toHaveBeenCalledTimes(2)
    expect(await waiting()).toBe(0)
    expect([...kv.keys()].filter(k => k.startsWith('tx:'))).toEqual([])
  })
})

describe('refusals', () => {
  it('tells each refused transaction once, with the name saved for the account, and nothing about the others', async () => {
    const who = { name: 'Dee Four', agent: '', location: '', limit: 1, selling: [], isell: [] }
    kv.set('acct:test:B', { who, h: '', t: 1 })
    const at = new Date(2026, 10, 3, 12).getTime() / 1000
    kv.set('tx:1', { ...tx(at), amount: '40.00', error: 'That account is not active.' })
    kv.set('tx:2', { ...tx(at), amount: '-5.00', otherId: 'C', error: 'bad-actor' })
    kv.set('tx:3', tx(at))
    expect(await refusals()).toEqual([
      ['tx:1', 'Charge of $40.00 to Dee Four on Nov 3: That account is not active.'],
      ['tx:2', 'Payment of $5.00 to C on Nov 3: You may not act for that account.']
    ])
  })
})

describe('out of space', () => {
  const who = { name: 'Dee', agent: '', location: '', limit: 1, selling: [], isell: [] }
  beforeEach(() => { kv.delete('secure:token') })
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
    await flush()
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
  const jpeg = new Uint8Array([0xff, 0xd8, 1, 2])
  it('come back only for the card code their profile was kept with', async () => {
    await cacheProfile(card, who); await cachePhoto(card, jpeg)
    const url = await offlinePhoto(card)
    expect(new Uint8Array(await (await fetch(url)).arrayBuffer())).toEqual(jpeg)
    expect(await offlinePhoto(other)).toBe('')
  })
  it('are kept per env', async () => {
    await cacheProfile(card, who); await cachePhoto(card, jpeg)
    vi.stubGlobal('localStorage', { getItem: () => 'demo' })
    expect(await offlinePhoto(card)).toBe('')
  })
  it('go with their profiles when not used for a year, checked at most once a day', async () => {
    kv.set('acct:test:A', { who, h: '', t: now - 366 * day }); kv.set('acct:test:B', { who, h: '', t: now - 364 * day })
    for (const a of 'ABC') kv.set(`photo:test:${a}`, { src: '', h: '' }) // C has no profile any more
    await dropUnused(now)
    expect([...kv.keys()].filter(k => !k.startsWith('unused') && !k.startsWith('secure:')).sort()).toEqual(['acct:test:B', 'photo:test:B'])
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
