import { describe, it, expect, vi, beforeEach } from 'vitest'

const kv = new Map<string, unknown>()
vi.mock('../../app/src/storage', () => ({
  store: {
    get: async (k: string) => kv.get(k),
    set: async (k: string, v: unknown) => { kv.set(k, v) },
    del: async (k: string) => { kv.delete(k) },
    all: async (p: string) => [...kv].filter(([k]) => k.startsWith(p)).sort(([a], [b]) => a < b ? -1 : 1)
  }
}))
const ls = new Map<string, string>()
vi.stubGlobal('localStorage', { getItem: (k: string) => ls.get(k) ?? null, setItem: (k: string, v: string) => void ls.set(k, v) })

const { env, isDemo, mismatch, target, switchTo, signedInFor, dropShelved, liveOf, START } = await import('../../app/src/lib/env')
const { cardKind } = await import('../../app/src/lib/qr')
const { secret } = await import('../../app/src/lib/secure')

beforeEach(() => { kv.clear(); ls.clear() })

describe('cardKind', () => {
  it('tells test cards from real ones, whatever the case of the address', () => {
    expect(cardKind('HTTP://6VM.RC4.ME/KDCA12345a')).toBe('test')
    expect(cardKind('http://6vm.rc2.me/KDCA12345a')).toBe('real')
    expect(cardKind('garbage')).toBeNull()
  })
})

describe('which env a card belongs to', () => {
  it('starts at the build\'s env, where a real card is an ordinary scan and a test card asks for demo', () => {
    expect(env()).toBe(START)
    expect(mismatch('real')).toBe(false)
    expect(mismatch('test')).toBe(true)
    expect(target('test')).toBe('demo')
  })
  it('in demo, a test card is ordinary and a real card goes back to the start env', async () => {
    await switchTo('demo')
    expect(isDemo()).toBe(true)
    expect(mismatch('test')).toBe(false)
    expect(mismatch('real')).toBe(true)
    expect(target('real')).toBe(START)
  })
  it('puts each env at its own pay site', () => {
    expect(liveOf('demo')).toBe('https://pay.demo.commongood.earth')
    expect(liveOf('main')).toBe('https://pay.main.commongood.earth')
  })
})

describe('switchTo', () => {
  const m = (acct: string) => ({ uid: 1, admin: false, accounts: [{ uid: 1, name: 'x', isCo: false, photo: null, device: { accountId: acct } }] })

  it('shelves this env\'s sign-in and brings back the other\'s, so switching back asks for nothing', async () => {
    await secret.set('token', 'real-token'); kv.set('member', m('KDCA')); kv.set('acct', 1); kv.set('dftAcct', 1)
    await switchTo('demo')
    expect(env()).toBe('demo')
    expect(await secret.get('token')).toBeUndefined()
    expect(kv.get('member')).toBeUndefined()
    await secret.set('token', 'demo-token'); kv.set('member', m('KDCD'))
    await switchTo(START)
    expect(await secret.get('token')).toBe('real-token')
    expect(kv.get('member')).toEqual(m('KDCA'))
    await switchTo('demo')
    expect(await secret.get('token')).toBe('demo-token')
  })

  it('does nothing when already there', async () => {
    await secret.set('token', 't')
    await switchTo(START)
    expect(await secret.get('token')).toBe('t')
  })
})

describe('signedInFor', () => {
  const mainOf = (id: string) => id.slice(0, 4)
  it('is true only with a token and the card\'s account among the shelved accounts', async () => {
    kv.set('member', { uid: 1, admin: false, accounts: [{ uid: 1, name: 'x', isCo: false, photo: null, device: { accountId: 'KDCA12' } }] })
    await secret.set('token', 't')
    await switchTo('demo')
    expect(await signedInFor(START, 'KDCA', mainOf)).toBe(true)
    expect(await signedInFor(START, 'KDCB', mainOf)).toBe(false)
    expect(await signedInFor('beta', 'KDCA', mainOf)).toBe(false)
  })
})

describe('dropShelved', () => {
  it('forgets the other env\'s sign-in (keeping its default account) and hands back its token to end', async () => {
    await secret.set('token', 'real-token'); kv.set('member', { uid: 1 }); kv.set('dftAcct', 7)
    await switchTo('demo')
    expect(await dropShelved()).toEqual([{ env: START, token: 'real-token' }])
    await switchTo(START)
    expect(await secret.get('token')).toBeUndefined()
    expect(kv.get('member')).toBeUndefined()
    expect(kv.get('dftAcct')).toBe(7)
  })
})
