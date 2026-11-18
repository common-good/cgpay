// The bundled screens keep their state (credentials, queued transactions, cached profiles) in a small key-value store.
// The interface is all the screens know, so the native app can swap in SQLite without touching them.
export interface Store {
  get<T = unknown>(k: string): Promise<T | undefined>
  set(k: string, v: unknown): Promise<void>
  del(k: string): Promise<void>
  /** Every [key, value] whose key starts with prefix, in key order (a queue is a prefix: 'tx:' + a sortable id). */
  all<T = unknown>(prefix: string): Promise<[string, T][]>
}

const DB = 'cgpay', TABLE = 'kv'

// Run one request on the table and resolve with its result (or, for a write, when the transaction commits).
const idb = (db: IDBDatabase, mode: IDBTransactionMode, go: (t: IDBObjectStore) => IDBRequest) => new Promise<any>((ok, no) => {
  const tx = db.transaction(TABLE, mode), req = go(tx.objectStore(TABLE))
  tx.oncomplete = () => ok(req.result)
  tx.onerror = tx.onabort = () => no(tx.error)
})

/** The IndexedDB store: for browsers and the BDD tests. */
export function indexedDbStore(): Store {
  const opened = new Promise<IDBDatabase>((ok, no) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(TABLE)
    req.onsuccess = () => ok(req.result)
    req.onerror = () => no(req.error)
  })
  const run = async (mode: IDBTransactionMode, go: (t: IDBObjectStore) => IDBRequest) => idb(await opened, mode, go)
  return {
    get: k => run('readonly', t => t.get(k)),
    set: async (k, v) => { await run('readwrite', t => t.put(v, k)) },
    del: async k => { await run('readwrite', t => t.delete(k)) },
    all: async prefix => {
      const range = IDBKeyRange.bound(prefix, prefix + '\uffff')
      const [keys, vals] = await Promise.all([run('readonly', t => t.getAllKeys(range)), run('readonly', t => t.getAll(range))])
      return keys.map((k: string, i: number) => [k, vals[i]])
    }
  }
}

// The one store the screens use. (The native app will pick its SQLite store here.)
export const store: Store = indexedDbStore()
