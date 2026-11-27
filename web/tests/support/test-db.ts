import type { APIRequestContext } from '@playwright/test'

// Client for the PHP cgmembers "test" API endpoint (testops() in
// cgmembers/rcredits/forms/api.inc). It refuses to run on production/stage.
//
// Ops: initialize (reset to the default test accounts), update (users table
// only), insert ("txs" or "tx_requests", between test accounts), rows ("txs", "tx_requests", "grants" or "app_tokens"), mfaOn, passcode, demo. Same protocol the old app's tests used.
const API = (process.env.TEST_API_URL ?? 'http://localhost/cg/cgmembers/api/').replace(/\/?$/, '/')

// Must match the format fixVersion() in cgmembers/rcredits/forms/api.inc accepts.
// Bump this when a PHP code path adds a new `+$version >= N` gate the tests need
// to exercise. Grep cgmembers for `$version >=` or `+$version` to find current gates.
const DEFAULT_TEST_API_VERSION = '40206'
const API_VERSION = process.env.TEST_API_VERSION ?? DEFAULT_TEST_API_VERSION

let loggedVersion = false

export class TestDb {
  constructor(private request: APIRequestContext) {}

  private async post(op: string, args: Record<string, string> = {}) {
    if (!loggedVersion) {
      console.log(`[test-db] using PHP test API version ${API_VERSION} (override with TEST_API_VERSION)`)
      loggedVersion = true
    }
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

  /** Update rows of the users table, or the app_tokens table (by uid: all that member's tokens). Each row must include uid. */
  update(table: 'users' | 'app_tokens', rows: Record<string, unknown>[]) {
    return this.post('update', { table, keyedValues: JSON.stringify(rows) })
  }

  /** Add transactions or invoices between test accounts, made the way the PHP features make them (txs: uid1, uid2, amt, for1, for2; tx_requests: payer, payee, amount, purpose). */
  insert(table: 'txs' | 'tx_requests', rows: Record<string, unknown>[]) {
    return this.post('insert', { table, keyedValues: JSON.stringify(rows) })
  }

  /** Relate test accounts: each row has main, other and permission (a name like "manage"). Initialize removes them again. */
  relate(rows: Record<string, unknown>[]) { return this.post('relate', { rows: JSON.stringify(rows) }) }

  /** All the test accounts' records in a table ("txs", "tx_requests" or "grants"), in key order. */
  rows(table: string): Promise<Record<string, unknown>[]> { return this.post('rows', { fieldList: '*', table }) }

  /** Turn multi-factor authentication on for a test account (initialize turns it off). */
  mfaOn(uid: number) { return this.post('mfaOn', { uid: String(uid) }) }

  /** Make the server act as demo (cards of the other kind, no MFA) or stop; initialize turns it off. */
  demo(on: boolean) { return this.post('demo', { on: on ? '1' : '0' }) }

  /** The passcode PHP emailed for a store app sign-in, read from the sign-in's MFA handle. */
  async passcode(handle: string): Promise<string> { return (await this.post('passcode', { handle })).nonce }

  /** All test-account transactions, ordered by xid. */
  txs(): Promise<Record<string, unknown>[]> { return this.rows('txs') }
}
