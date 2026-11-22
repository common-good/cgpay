import { describe, it, expect, vi, beforeEach } from 'vitest'

// The app's own packages (web/app has its own node_modules), mocked by path so the mocks reach the app's imports.
const rows = new Map<string, string>(), secure = new Map<string, string>()
let secureFails = false, secureDrops = false, secureRemoves = false
vi.mock('../../app/node_modules/@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }))

// SQLite as the plugin presents it: the native connection outlives the page, and a page that does not know it must close it before opening another.
let native = false
const db = {
  isDBOpen: async () => ({ result: true }),
  execute: async () => ({}),
  query: async (q: string, [a, b]: any[]) => ({ values: q.includes('substr')
    ? [...rows].filter(([k]) => k.slice(0, a) === b).sort(([x], [y]) => x < y ? -1 : 1).map(([k, v]) => ({ k, v }))
    : rows.has(a) ? [{ v: rows.get(a) }] : [] }),
  run: async (q: string, [k, v]: any[]) => { if (q.startsWith('DELETE')) rows.delete(k); else rows.set(k, v); return {} }
}
vi.mock('../../app/node_modules/@capacitor-community/sqlite', () => ({ CapacitorSQLite: {}, SQLiteConnection: class {
  mine = false
  async checkConnectionsConsistency() { if (!this.mine) native = false; return { result: this.mine } }
  async isConnection() { return { result: this.mine } }
  async retrieveConnection() { return db }
  async createConnection() { if (native) throw new Error('Connection cgpay already exists'); native = this.mine = true; return db }
} }))
vi.mock('../../app/node_modules/capacitor-secure-storage-plugin', () => ({ SecureStoragePlugin: {
  get: async ({ key }: { key: string }) => { if (secureRemoves) { secureRemoves = false; secure.delete(key); throw new Error('no') } if (secureFails || !secure.has(key)) throw new Error('no'); return { value: secure.get(key)! } },
  set: async ({ key, value }: { key: string, value: string }) => { if (!secureDrops) secure.set(key, value); return { value: true } },
  keys: async () => ({ value: [...secure.keys()] })
} }))

// An in-memory store standing in for IndexedDB, which node lacks.
const memory = (kv: Map<string, unknown>) => ({
  get: async (k: string) => kv.get(k) as any,
  set: async (k: string, v: unknown) => { kv.set(k, v) },
  del: async (k: string) => { kv.delete(k) },
  all: async (p: string) => [...kv].filter(([k]) => k.startsWith(p)) as any,
  keys: async (p: string) => [...kv.keys()].filter(k => k.startsWith(p))
})

// A fresh module each time, so the key is read and the database opened again, as when the page reloads or the app starts.
const fresh = async (old = new Map<string, unknown>()) => { vi.resetModules(); return (await import('../../app/src/storage')).nativeStore(() => memory(old)) }

const prefsLen = (k: string) => rows.get(k)!.length

beforeEach(() => { rows.clear(); native = false; secure.clear(); secureFails = secureDrops = secureRemoves = false })

describe('the phone\'s store', () => {
  it('keeps values encrypted, lists a prefix in key order, and forgets', async () => {
    const s = await fresh()
    await s.set('tx:2', { amount: '-2.00' }); await s.set('tx:1', { amount: '-1.00' }); await s.set('device', { cardCode: 'SECRETCODE' })
    expect([...rows.values()].join()).not.toMatch(/SECRETCODE|amount/)
    expect(await s.all('tx:')).toEqual([['tx:1', { amount: '-1.00' }], ['tx:2', { amount: '-2.00' }]])
    expect(await s.keys('tx:')).toEqual(['tx:1', 'tx:2'])
    await s.del('tx:1'); await s.set('device', undefined)
    expect(await s.all('')).toEqual([['tx:2', { amount: '-2.00' }]])
    expect(await (await fresh()).get('tx:2')).toEqual({ amount: '-2.00' }) // the same key next time the app starts
  })
  it('keeps bytes as bytes, in less room than as JSON', async () => {
    const s = await fresh(), jpeg = Uint8Array.from({ length: 3000 }, (_, i) => i % 256)
    await s.set('photo:x', jpeg)
    expect(await s.get('photo:x')).toEqual(jpeg)
    expect(prefsLen('photo:x')).toBeLessThan(3000 * 1.4)
  })
  it('takes over what the WebView kept, without overwriting what it has', async () => {
    const old = new Map<string, unknown>([['tx:1', { amount: '-1.00' }], ['acct', 7]])
    await (await fresh()).set('acct', 9)
    const s = await fresh(old)
    expect(await s.all('')).toEqual([['acct', 9], ['tx:1', { amount: '-1.00' }]])
    expect(old.size).toBe(0)
  })
  it('does not read a value moved to another key', async () => {
    const s = await fresh()
    await s.set('a', 1)
    rows.set('b', rows.get('a')!)
    expect(await s.get('b')).toBeUndefined()
  })
  it('reads nothing once the key is gone, and makes a new one', async () => {
    await (await fresh()).set('a', 1)
    const k = secure.get('storeKey'); secure.clear()
    const s = await fresh()
    expect(await s.get('a')).toBeUndefined()
    await s.set('a', 2)
    expect(secure.get('storeKey')).not.toBe(k)
    expect(await s.get('a')).toBe(2)
  })
  it('never replaces a key it cannot read just now', async () => {
    await (await fresh()).set('a', 1)
    const k = secure.get('storeKey'); secureFails = true
    await expect((await fresh()).get('a')).rejects.toThrow()
    expect(secure.get('storeKey')).toBe(k)
    secureFails = false
    expect(await (await fresh()).get('a')).toBe(1)
  })
  it('makes a new key when reading the old one removes it (Android, after a backup is restored to another phone)', async () => {
    await (await fresh()).set('a', 1)
    const k = secure.get('storeKey'); secureRemoves = true
    const s = await fresh()
    expect(await s.get('a')).toBeUndefined()
    expect(secure.get('storeKey')).not.toBe(k)
  })
  it('fails when the secure store drops the new key, rather than encrypting with a key nobody kept', async () => {
    secureDrops = true
    await expect((await fresh()).set('a', 1)).rejects.toThrow()
    expect(rows.size).toBe(0)
  })
})
