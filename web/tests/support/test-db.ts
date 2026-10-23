import type { APIRequestContext } from '@playwright/test'

// Client for the PHP cgmembers "test" API endpoint (testops() in
// cgmembers/rcredits/forms/api.inc). It refuses to run on production/stage.
//
// Ops: initialize (reset to the default test accounts), update (users table
// only), rows (txs table only). Same protocol the old app's tests used.
const API = (process.env.TEST_API_URL ?? 'http://localhost/cg/cgmembers/api/').replace(/\/?$/, '/')
const API_VERSION = process.env.TEST_API_VERSION ?? '40206' // fixVersion() in api.inc; matches the old app's constants.js

export class TestDb {
  constructor(private request: APIRequestContext) {}

  private async post(op: string, args: Record<string, string> = {}) {
    const res = await this.request.post(API + 'test', { form: { version: API_VERSION, op, ...args } })
    if (!res.ok()) throw new Error(`test endpoint "${op}" failed: HTTP ${res.status()} ${await res.text()}`)
    const text = await res.text()
    // exitJson returns JSON; exitJust (errors) may not. Surface anything that isn't ok.
    try {
      const json = JSON.parse(text)
      if (json && json.ok === 0) throw new Error(`test endpoint "${op}" refused: ${text}`)
      return json
    } catch (e) {
      if (e instanceof SyntaxError) throw new Error(`test endpoint "${op}" returned non-JSON: ${text.slice(0, 200)}`)
      throw e
    }
  }

  /** Reset the server's test accounts (and remove their stray transactions) to the defaults. */
  initialize() { return this.post('initialize') }

  /** Update rows of the users table. Each row must include uid. */
  updateUsers(rows: Record<string, unknown>[]) {
    return this.post('update', { table: 'users', keyedValues: JSON.stringify(rows) })
  }

  /** All the test accounts' records in a table ("txs" or "grants"), in key order. */
  rows(table: string): Promise<Record<string, unknown>[]> { return this.post('rows', { fieldList: '*', table }) }

  /** All test-account transactions, ordered by xid. */
  txs(): Promise<Record<string, unknown>[]> { return this.rows('txs') }
}
