import type { App } from '../steps/fixtures'
import { rowProblems } from './compare'
import { tableData } from './table'

// Data in the test database, through the PHP test endpoint (see test-db.ts).
type Rows = Record<string, unknown>[]

const readers: Record<string, (app: App) => Promise<Rows>> = { txs: app => app.testDb.txs() }
const writers: Record<string, (app: App, rows: Rows) => Promise<unknown>> = { users: (app, rows) => app.testDb.updateUsers(rows) }

/** Set records ("users" only, so far): each row has the uid (a nickname works) and the fields to change. */
export async function setThese(app: App, name: string, table: { raw(): string[][] }) {
  const write = writers[name]
  if (!write) throw new Error(`these "${name}" rows: cannot be set. Can set: ${Object.keys(writers).join(', ')}.`)
  await write(app, tableData(table, 'rows', app) as Rows)
}

/** The app has exactly these records ("txs" only, so far), comparing only the columns the table lists. */
export async function soThese(app: App, name: string, table: { raw(): string[][] }) {
  const read = readers[name]
  if (!read) throw new Error(`these "${name}" rows: cannot be read. Can read: ${Object.keys(readers).join(', ')}.`)
  const problems = rowProblems(await read(app), tableData(table, 'rows', app) as Rows, app)
  if (problems.length) throw new Error(`these "${name}" rows: ${problems.join('; ')}`)
}
