import type { App } from '../steps/fixtures'
import { rowProblems } from './compare'
import { tableData, type Shape } from './table'
import { resolve } from './magic'
import resetCodes from './reset-codes'

// Data in the test database (through the PHP test endpoint, see test-db.ts) and scenario variables.
type Rows = Record<string, unknown>[]

const readers: Record<string, (app: App) => Promise<Rows>> = { grants: app => app.testDb.rows('grants'), txs: app => app.testDb.rows('txs'), reset_codes: () => resetCodes.rows() }
const writers: Record<string, (app: App, rows: Rows) => Promise<unknown>> = { users: (app, rows) => app.testDb.updateUsers(rows), reset_codes: (app, rows) => resetCodes.insert(rows, app.now) }

// Some writes land after the reply (reset-request answers before the code is made), so data checks retry for a moment.
async function eventually(problem: () => Promise<string | null>, ms = 3000) {
  for (const end = Date.now() + ms; ; await new Promise(r => setTimeout(r, 100))) {
    const p = await problem()
    if (!p) return
    if (Date.now() > end) throw new Error(p)
  }
}

async function read(app: App, name: string): Promise<Rows> {
  const reader = readers[name]
  if (!reader) throw new Error(`"${name}" cannot be read. Can read: ${Object.keys(readers).join(', ')}.`)
  return await reader(app)
}

export default {
  /** Set records ("users" and "reset_codes"): each row has the uid (a nickname works) and the fields to change. */
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

  /** The app has this many records ("txs", "grants" and "reset_codes"). */
  async soCount(app: App, name: string, n: number) {
    await eventually(async () => { const got = (await read(app, name)).length; return got === n ? null : `count "${name}" is ${n}: got ${got}.` })
  },

  /** The app has all of these records (and maybe more), comparing only the columns the table lists ("txs", "grants" and "reset_codes"). */
  async soThese(app: App, name: string, table: { raw(): string[][] }) {
    const want = tableData(table, 'rows', app) as Rows
    await eventually(async () => { const ps = rowProblems(await read(app, name), want, app); return ps.length ? `these "${name}" rows: ${ps.join('; ')}` : null })
  }
}
