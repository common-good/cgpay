// The bundled screens keep their state (credentials, queued transactions, cached profiles) in a small key-value store.
// The interface is all the screens know: browsers and the BDD tests get IndexedDB, the phone gets nativeStore.
import { Capacitor } from '@capacitor/core'
import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from '@capacitor-community/sqlite'
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin'

export interface Store {
  get<T = unknown>(k: string): Promise<T | undefined>
  set(k: string, v: unknown): Promise<void>
  del(k: string): Promise<void>
  /** Every [key, value] whose key starts with prefix, in key order (a queue is a prefix: 'tx:' + a sortable id). */
  all<T = unknown>(prefix: string): Promise<[string, T][]>
  /** Every key that starts with prefix, in key order, without reading the values. */
  keys(prefix: string): Promise<string[]>
}

const DB = 'cgpay', TABLE = 'kv'

// Run one request on the table and resolve with its result (or, for a write, when the transaction commits).
const idb = (db: IDBDatabase, mode: IDBTransactionMode, go: (t: IDBObjectStore) => IDBRequest) => new Promise<any>((ok, no) => {
  const tx = db.transaction(TABLE, mode), req = go(tx.objectStore(TABLE))
  tx.oncomplete = () => ok(req.result)
  tx.onerror = tx.onabort = () => no(tx.error)
})

/** The IndexedDB store: for browsers and the BDD tests. A phone may clear it when short of space, so the phone uses it no more. */
export function indexedDbStore(): Store {
  const opened = new Promise<IDBDatabase>((ok, no) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(TABLE)
    req.onsuccess = () => ok(req.result)
    req.onerror = () => no(req.error)
  })
  opened.catch(() => {}) // a failure surfaces on each use, not as an unhandled rejection at startup
  const range = (prefix: string) => IDBKeyRange.bound(prefix, prefix + '\uffff')
  const run = async (mode: IDBTransactionMode, go: (t: IDBObjectStore) => IDBRequest) => idb(await opened, mode, go)
  return {
    get: k => run('readonly', t => t.get(k)),
    set: async (k, v) => { await run('readwrite', t => t.put(v, k)) },
    del: async k => { await run('readwrite', t => t.delete(k)) },
    all: async prefix => {
      const [keys, vals] = await Promise.all([run('readonly', t => t.getAllKeys(range(prefix))), run('readonly', t => t.getAll(range(prefix)))])
      return keys.map((k: string, i: number) => [k, vals[i]])
    },
    keys: prefix => run('readonly', t => t.getAllKeys(range(prefix)))
  }
}

const KEY = 'storeKey', BYTES = 1
const b64 = (u: Uint8Array) => { let s = ''; for (const c of u) s += String.fromCharCode(c); return btoa(s) }
const unb64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0))
const utf8 = (s: string) => new TextEncoder().encode(s)

let aes: Promise<CryptoKey> | undefined

/**
 * The key the phone's store is encrypted with, kept in the Keychain (iOS) or Keystore (Android); made on first use.
 * A new key is made only when the secure store lists none: a key that is there but cannot be read now must not be replaced, or everything
 * written with it is lost. (On Android a key that cannot be decrypted, as after a backup is restored to another phone, is removed by the read, so
 * it is then no longer listed.) The read-back catches a write the plugin dropped (its Android side only logs a failure).
 */
const storeKey = () => aes ??= (async () => {
  const read = () => SecureStoragePlugin.get({ key: KEY }).then(r => r.value)
  const listed = async () => (await SecureStoragePlugin.keys()).value.includes(KEY)
  let k = await listed() ? await read().catch(async er => { if (await listed()) throw er; return '' }) : ''
  if (!k) {
    await SecureStoragePlugin.set({ key: KEY, value: k = b64(crypto.getRandomValues(new Uint8Array(32))) })
    if (await read() !== k) throw new Error('The secure store did not keep the key.')
  }
  return crypto.subtle.importKey('raw', unb64(k), 'AES-GCM', false, ['encrypt', 'decrypt'])
})().catch(er => { aes = undefined; throw er })

// A value as kept: iv.ciphertext, with its key name bound in, so a value moved to another key does not read.
// Bytes (a photo) are kept as they are, after a 1 that no JSON starts with, rather than as JSON.
async function seal(k: string, v: unknown) {
  const iv = crypto.getRandomValues(new Uint8Array(12)), plain = v instanceof Uint8Array ? new Uint8Array([BYTES, ...v]) : utf8(JSON.stringify(v))
  const c = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: utf8(k) }, await storeKey(), plain)
  return b64(iv) + '.' + b64(new Uint8Array(c))
}

// A value that does not decrypt (written with a key since lost, e.g. restored from a backup to another phone) reads as missing.
async function unseal<T>(k: string, s: string | null): Promise<T | undefined> {
  if (!s) return undefined
  const key = await storeKey(), [iv, c] = s.split('.').map(unb64)
  try {
    const p = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: utf8(k) }, key, c))
    return (p[0] === BYTES ? p.slice(1) : JSON.parse(new TextDecoder().decode(p))) as T
  } catch { return undefined }
}

let conn: Promise<SQLiteDBConnection> | undefined

// The database's native connection outlives the page (the app goes to the live site and back), so a reloaded page drops the stale one and opens it again.
const sql = () => conn ??= (async () => {
  const sqlite = new SQLiteConnection(CapacitorSQLite)
  const have = (await sqlite.checkConnectionsConsistency()).result && (await sqlite.isConnection(DB, false)).result
  const db = have ? await sqlite.retrieveConnection(DB, false) : await sqlite.createConnection(DB, false, 'no-encryption', 1, false)
  if (!(await db.isDBOpen()).result) await db.open()
  await db.execute(`CREATE TABLE IF NOT EXISTS ${TABLE} (k TEXT PRIMARY KEY NOT NULL, v TEXT NOT NULL)`)
  return db
})().catch(er => { conn = undefined; throw er })

const rows = async (q: string, a: unknown[]) => ((await (await sql()).query(q, a)).values ?? []) as { k: string, v: string }[]
const run = async (q: string, a: unknown[]) => { await (await sql()).run(q, a) }

/**
 * The phone's store: a SQLite table (in the app's own files, which the phone does not clear), each value encrypted with storeKey.
 * On first use it takes over what an earlier version kept in IndexedDB (old: for the tests).
 */
export function nativeStore(old: () => Store = indexedDbStore): Store {
  const s: Store = {
    get: async k => unseal(k, (await rows(`SELECT v FROM ${TABLE} WHERE k = ?`, [k]))[0]?.v ?? null),
    set: async (k, v) => v === undefined ? s.del(k) : run(`INSERT OR REPLACE INTO ${TABLE} (k, v) VALUES (?, ?)`, [k, await seal(k, v)]),
    del: k => run(`DELETE FROM ${TABLE} WHERE k = ?`, [k]),
    all: async prefix => {
      const rs = await rows(`SELECT k, v FROM ${TABLE} WHERE substr(k, 1, ?) = ? ORDER BY k`, [prefix.length, prefix])
      return (await Promise.all(rs.map(async r => [r.k, await unseal(r.k, r.v)] as [string, any]))).filter(([, v]) => v !== undefined)
    },
    keys: async prefix => (await rows(`SELECT k FROM ${TABLE} WHERE substr(k, 1, ?) = ? ORDER BY k`, [prefix.length, prefix])).map(r => r.k)
  }
  const ready = (async () => {
    try {
      const o = old()
      for (const [k, v] of await o.all('')) { if (await s.get(k) === undefined) await s.set(k, v); await o.del(k) }
    } catch { /* nothing to take over, or it will be tried again next time */ }
  })()
  const after = <A extends unknown[], R>(f: (...a: A) => Promise<R>) => async (...a: A) => { await ready; return f(...a) }
  return { get: after(s.get), set: after(s.set), del: after(s.del), all: after(s.all), keys: after(s.keys) } as Store
}

// The one store the screens use.
export const store: Store = Capacitor.isNativePlatform() ? nativeStore() : indexedDbStore()
