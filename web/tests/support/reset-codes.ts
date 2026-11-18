import mysql from 'mysql2/promise'
import { createHmac } from 'node:crypto'

// The reset_codes table, straight from the database (the PHP test endpoint knows nothing of it). Uses the app's own
// DB_* settings, which are enough: the app's user may read and write exactly this table.
type Rows = Record<string, unknown>[]

let pool: mysql.Pool | undefined
const db = () => pool ??= mysql.createPool({
  host: process.env.DB_HOST ?? '127.0.0.1', port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME
})

// Must match hashCode() in src/lib/server/reset.ts.
const hash = (uid: unknown, code: unknown) => {
  const key = process.env.PHP_SSO_SECRET
  if (!key) throw new Error('PHP_SSO_SECRET is not set (it goes in web/.env, which playwright.config.ts loads).')
  return createHmac('sha256', key).update(`reset:${uid}:${code}`).digest('hex')
}

export default {
  async clear() { await db().execute('DELETE FROM reset_codes') },

  async rows(): Promise<Rows> { return (await db().execute('SELECT * FROM reset_codes ORDER BY id'))[0] as Rows },

  /** Add rows. A row may say `code` (the digits the member would type) instead of codeHash; the rest default to a fresh, unused email code. */
  async insert(rows: Rows, now: number) {
    for (const { code, ...r } of rows) {
      const row = { tries: 0, channel: 'email', created: now, expires: now + 600, ...r, ...(code === undefined ? {} : { codeHash: hash(r.uid, code) }) }
      const ks = Object.keys(row)
      await db().execute(`INSERT INTO reset_codes (${ks.join(',')}) VALUES (${ks.map(() => '?').join(',')})`, Object.values(row) as never[])
    }
  }
}
