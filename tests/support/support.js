import { assert, expect } from 'chai'
import c from '../../constants.js'
import w from './world.js'

const baseUrl = 'http://localhost:' + c.port + '/'

const t = {

  // UTILITY FUNCTIONS

  whatPage: async () => { 
    const el = await w.page.$('.page')
    try {
      return el ? await w.page.$eval( '.page', el => getAttribute('data-testid') ) : null
    } catch (er) {
      console.log('Page has no .page element')
      return 'UNKNOWN PAGE'
    }
  },

  /**
   * Get all stored values (the storage state)
   * @returns {*} st: an object containing all the app's stored values
   */
  getStore: async () => {
    const st = await w.page.evaluate((key) => localStorage.getItem(key), c.storeKey)
    return JSON.parse(st)
  },

  putStore: async (st) => {
    await w.page.evaluate((k, v) => {
      localStorage.setItem(k, JSON.stringify(v))
    }, c.storeKey, st)
    w.reloadStore = true
    await w.page.waitForTimeout(c.networkTimeoutMs + 1) // give the network timeout function time to reload the store
  },

  getv: async (k) => {
    const st = await t.getStore()
    return st ? st[k] : null
  },

  putv: async (k, v) => {
    let st = await t.getStore()
//    console.log('st before putv:', st, 'v:', v)
    if (st == null) st = {}
    st[k] = t.clone(v)
//    console.log('st after putv:', st, 'v:', v)
    await t.putStore(st)
  },

  these: ({ rawTable:rows }, one ) => {
//    console.log('rows:', rows)
    if (one) t.test(rows.length, 2)
    let v = []
    for (let rowi = 1; rowi < rows.length; rowi++) {
      v[rowi - 1] = {}
      for (let coli in rows[0]) v[rowi - 1][rows[0][coli]] = t.adjust(rows[rowi], coli)
    }
    return t.clone(one ? v[0] : v)
  },

  /**
   * Return value or value[k] with adjustments for special parameters, including:
   * now: current millisecond
   * null, true, false: convert from string
   */
  adjust: (value, k) => {
    if (value == null) return null
    let v = typeof value === 'object' ? value[k] : value
    if (v == 'now') return t.now() / 1000
    if (v == 'null') return null
    if (v == 'true') return true
    if (v == 'false') return false

    const me = w.accounts[v]
    if (me != null) return k == 'actorId' ? me.accountId
    : (k == 'otherId' ? me.accountId + me.cardCode
    : (k == 'qr' ? 'HTTP://6VM.RC4.ME/' + me.qr.substring(0, 1) + me.qr.substring(4) + me.cardCode
    : (v) ))

    return v
  },

  /**
   * Test whether what we got equals (or sort of equals) what we wanted.
   * If mode is not specified, time fields are compared loosely (within a couple seconds)
   * @param {*} got 
   * @param {*} want: what is wanted (recurses if want is an object)
   * @param string field: name of field being tested (to inform substitutions)
   * @param string mode: exact (default), part, or <n (meaning got and want are less than n apart) 
   */
  test: (got, want, field = null, mode = null) => {
    if (typeof want === 'object' && want !== null) {
      assert.isNotNull(got, 'should not be null')
      t.test(typeof got, 'object')
      t.test(got.length, want.length)
      let modei
      for (let i in want) {
        modei = mode == null ? (t.isTimeField(i) ? '<2' : null) : mode
        t.test(got[i], want[i], i, modei)
      }
      return
    }

    if (want == '?') return // anything is acceptable
    const msg = `got: ${got} wanted: ${want}`
    want = t.adjust(want, field)
    if (mode == 'exact' || mode == null) {
      assert.equal(got, want, msg)
     } else if (mode == 'part') {
      assert.include(got, want, msg)
    } else if (mode.substring(0, 1) == '<') {
      assert.isBelow(Math.abs(got - want), +mode.substring(1), msg)
    } else assert.fail('bad mode:' + mode)
  },

  element: async (testId) => { return await w.page.$(t.sel(testId)) },
  sel: (testId) => { return `[data-testid="${testId}"]` },
  isTimeField: (k) => { return 'created'.split(' ').includes(k) },
  now: () => { return Date.now() },
  clone: (v) => { return JSON.parse(JSON.stringify(v)) }, // deep clone (assumes object contains just objects, numbers, and strings)

  // MAKE / DO

  visit: async (target, wait = 'networkidle0') => { 
    const options = wait ? { waitUntil:wait } : {} // load, domcontentloaded, networkidle0, or networkidle2
    return await w.page.goto(baseUrl + target, options)
  },

  /**
   * 
   * @param string k: key to value in store to store 
   * @param {*} rows: gherkin array of arrays representing records to store
   *                  first row is a list of field names, subsequent rows are the field values
   * @param bool one: true to store just the first record rather than an array of records
   */
  setThese: async (k, multi, one = false) => {
    const v = t.these(multi, one)
    await t.putv(k, v)
//    console.log('after setThese k:', k, 'store:', await t.getStore())
  },

  setUA: async (browser, sys) => {
    let agent = ''
    if (sys == 'Apple' && browser == 'Safari') agent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/36.0  Mobile/15E148 Safari/605.1.15'
    if (sys == 'Android' && browser == 'Chrome') agent = 'Mozilla/5.0 (Linux; Android 11; SM-T227U Build/RP1A.200720.012; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/87.0.4280.141 Safari/537.36'
    await w.page.setUserAgent(agent)
  },

  input: async (id, text) => { 
    await w.page.type(t.sel('input-' + id), text)
    const newValue = await w.page.$eval(t.sel('input-' + id), el => el.value)
    t.test(newValue, text)
  },

  // TEST

  /**
   * Compare a set of stored records we have with what was expected.
   * @param string k: key to value in store to test
   * @param {*} multi: gherkin array of arrays representing records to store
   *                   first row is a list of field names, subsequent rows are the field values
   * @param bool one: true to test just the first record rather than an array of records
   */
  testThese: async (k, multi, one = false) => {
//    console.log('in testThese k:', k, 'multi:', multi, 'one:', one, 'store(k):', await t.getv(k))
    t.test(await t.getv(k), t.these(multi, one))
  },

  testThis: async (k, v) => {
    if (typeof v === 'object') return t.testThese(k, v, true)
    t.test(await t.getv(k), v, k)
  },

  onPage: async (id) => {
    const el = await w.page.$(`#${id}`)
    if (el == null) {
      await w.page.screenshot({ path: 'found.png' })
      const here = await t.whatPage()
      assert.isNotNull(el, `page "${id}" not found. You are on page "${here}" (see page found in found.png).`)
    }
  },

  see: async (testId) => {
    const el = await t.element(testId)
    if (el == null) await w.page.screenshot({ path: 'found.png' })
    assert.isNotNull(el, "see page image in found.png")
    return el // this is required (I don't know why)
  },

  seeIs: async (testId, want, mode = 'exact') => {
    const gotEl = await t.see(testId)
    const got = await gotEl.evaluate(el => el.textContent)
    t.test(got, want, null, mode)
  },

  dontSee: async (testId) => { assert.isNull(await t.element(testId), "shouldn't see" + testId) },

  signedInAs: async (who) => {
    const me = w.accounts[who]
    await t.putv('myAccount', { name:me.name, isCo:me.isCo, accountId:me.accountId, deviceId:me.deviceId, selling:me.selling, qr:'qr' + me.name.substring(0, 1) })
    // just = 'name isCo accountId deviceId selling'; { ...just, qr:, lastTx:null }
  }

}

export default t
