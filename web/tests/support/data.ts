import { expect } from '@playwright/test'
import type { App } from '../steps/fixtures'
import { rowProblems } from './compare'
import { tableData, type Shape } from './table'
import { resolve } from './magic'
import resetCodes from './reset-codes'

// Data in the test database (through the PHP test endpoint, see test-db.ts) and scenario variables.
type Rows = Record<string, unknown>[]

const readers: Record<string, (app: App) => Promise<Rows>> = { grants: app => app.testDb.rows('grants'), txs: app => app.testDb.rows('txs'), tx_requests: app => app.testDb.rows('tx_requests'), app_tokens: app => app.testDb.rows('app_tokens'), reset_codes: () => resetCodes.rows() }
const writers: Record<string, (app: App, rows: Rows) => Promise<unknown>> = {
  users: (app, rows) => app.testDb.update('users', rows), app_tokens: (app, rows) => app.testDb.update('app_tokens', rows), u_relations: (app, rows) => app.testDb.relate(rows), reset_codes: (app, rows) => resetCodes.insert(rows, app.now),
  txs: (app, rows) => app.testDb.insert('txs', rows), tx_requests: (app, rows) => app.testDb.insert('tx_requests', rows) }

// Retry a data check for a while: some writes land after the screen moves on (the app uploads queued transactions in the background; reset-request answers before the code is made).
const settled = (check: () => Promise<void>) => expect(check).toPass({ timeout: 10_000, intervals: [250, 500, 1000] })

async function read(app: App, name: string): Promise<Rows> {
  const reader = readers[name]
  if (!reader) throw new Error(`"${name}" cannot be read. Can read: ${Object.keys(readers).join(', ')}.`)
  return await reader(app)
}

export default {
  /** Set records ("users", "app_tokens" and "reset_codes": each row has the uid, a nickname works, and the fields to change), or add relations ("u_relations": main, other, permission). */
  async setThese(app: App, name: string, table: { raw(): string[][] }) {
    const write = writers[name]
    if (!write) throw new Error(`these "${name}" rows: cannot be set. Can set: ${Object.keys(writers).join(', ')}.`)
    await write(app, tableData(table, 'rows', app) as Rows)
  },

  /**
   * Define a variable. The value is evaluated now (so %now-2d is fixed from here on), except account
   * nicknames, which wait until the variable is used and the field is known.
   */
  setVar(app: App, name: string, value: unknown) {
    app.vars.set(name, resolve(value, undefined, app, { nicknames: false }))
  },

  /** Define a variable from a table, read in the given shape (see table.ts). Nicknames wait until the variable is used. */
  setVarTable(app: App, name: string, table: { raw(): string[][] }, shape: Shape) {
    app.vars.set(name, tableData(table, shape, app, { nicknames: false }))
  },

  /** The app has this many records ("txs", "tx_requests", "grants", "app_tokens" and "reset_codes"). */
  async soCount(app: App, name: string, n: number) {
    await settled(async () => {
      const got = (await read(app, name)).length
      if (got !== n) throw new Error(`count "${name}" is ${n}: got ${got}.`)
    })
  },

  /** The app has all of these records (and maybe more), comparing only the columns the table lists ("txs", "tx_requests", "grants" and "reset_codes"). */
  async soThese(app: App, name: string, table: { raw(): string[][] }) {
    const want = tableData(table, 'rows', app) as Rows
    await settled(async () => {
      const problems = rowProblems(await read(app, name), want, app)
      if (problems.length) throw new Error(`these "${name}" rows: ${problems.join('; ')}`)
    })
  }
}
