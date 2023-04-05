import { assert, expect } from 'chai'
import c from '../../constants.js'
import u from '../../utils0.js'
import cache from '../../src/cache.js'
import w from './world.js'

const baseUrl = 'http://localhost:' + c.port + '/'

const t = {

  // UTILITY FUNCTIONS

  getst(key = c.storeKey) { return JSON.parse(localStorage.getItem(key)) }, // for debugging
  async pic(picName = 'pic') { await w.page.screenshot({ path:picName + '.png' }) }, // screen capture
  async wait(secs) { await w.page.waitForTimeout(secs * 1000) },

  async whatPage() { 
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
  async getStore(key = c.storeKey) {
    const localStorage = await w.page.evaluate(() =>  Object.assign({}, window.localStorage))
    return JSON.parse(localStorage[key])
  },

  async putStore(st, key = c.storeKey) {
    if (u.empty(st)) st = {}
    st = JSON.stringify(st)
    await w.page.evaluate((k, v) => { localStorage.setItem(k, v) }, key, st)
    await w.page.waitForTimeout(c.networkTimeoutMs +1) // give the network timeout function time to reload the store
  },

  async getv(k) {
    const st = await t.getStore()
    return st ? st[k] : null
  },

  async putv(k, v) {
    let st = await t.getStore()
    if (u.empty(st)) st = { ...cache }
    st['fromTester'][k] = st[k] = v
    if (k == 'online') st['fromTester']['useWifi'] = st['useWifi'] = v // these values go together for faking online/offline
    await t.putStore(st)
    w.tellApp = true
  },

  /**
   * This function is exposed to the app by the "page.exposeFunction" function in BeforeAll() (see in hooks.js).
   * @returns true if there is data waiting for the app to store (see t.putv() and store.fromTester())
   */
  async tellApp() {
    const res = w.tellApp
    w.tellApp = false
    return res
  },
  
  these: ({ rawTable:rows }, one ) => {
//    console.log('rows:', rows)
    if (one) t.test(rows.length, 2)
    let v = []
    for (let rowi = 1; rowi < rows.length; rowi++) {
      v[rowi - 1] = {}
      for (let coli in rows[0]) v[rowi - 1][rows[0][coli]] = t.adjust(rows[rowi], coli)
    }
    return u.clone(one ? v[0] : v)
  },

  /**
   * Return value or value[k] with adjustments for special parameters, including:
   * now: current millisecond
   * null, true, false: convert from string
   */
  adjust: (value, k) => {
    if (value == null) return null
    let v = typeof value === 'object' ? value[k] : value
    if (v == 'now') return u.now()
    if (v == 'null') return null
    if (v == 'true') return true
    if (v == 'false') return false
    if (v == 'other') return 'garbage' // this even works for k='qr'

    const me = w.accounts[v]
//    console.log('adjust v', v, 'me', me)
    if (me != null) return k == 'actorId' ? me.accountId
    : (k == 'otherId' ? me.accountId + me.cardCode
    : (k == 'qr' ? c.testQrStart + me.accountId.substring(0, 1) + me.accountId.substring(4) + me.cardCode
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
        modei = u.empty(mode) ? (t.isTimeField(i) ? '<' + w.timeSlop : null) : mode
        t.test(got[i], want[i], i, modei)
      }
      return
    }

    if (want == '?') return // anything is acceptable
    const msg = `got: ${got} wanted: ${want}`
    want = t.adjust(want, field)
    if (mode === false) {
      assert.notEqual(got, want, msg + ' - NOT')
    } else if (mode == 'exact' || mode == null) {
      assert.equal(got, want, msg)
    } else if (mode == 'part') {
      assert.include(got, want, msg)
    } else if (mode.substring(0, 1) == '<') {
      assert.isBelow(Math.abs(got - want), +mode.substring(1), msg)
    } else assert.fail('bad mode:' + mode)
  },

  async element(testId) { return await w.page.$(t.sel(testId)) },
  sel(testId) { return `[data-testid="${testId}"]` },
  isTimeField(k) { return 'created'.split(' ').includes(k) },
  
  // MAKE / DO

  async visit(target, wait = 'networkidle0') { 
    const options = wait ? { waitUntil:wait } : {} // load, domcontentloaded, networkidle0, or networkidle2
    await w.page.goto(baseUrl + target, options)
    await t.pic('visited')
  },

  /**
   * Initialize an array or object
   * @param string k: key to value in store to store 
   * @param {*} v: value or gherkin array of arrays representing records to store
   *               for an array, first row is a list of field names, subsequent rows are the field values
   * @param bool one: true to store just the first record rather than an array of records
   */
  setThis: async (k, v, one = false) => {
    if (typeof v === 'object') v = t.these(v, one)
    await t.putv(k, t.adjust(v, k))
//    console.log('after setThis k:', k, v, one)
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

  /**
   * Set or compare accts[] or choices[] in the store to the expected list.
   * Confirm only that the key, agent, and name of each entry are as expected.
   * @param string field: which field - accts or choices
   * @param {*} row: a single row/list of account identifiers
   * @param bool set: true if setting the value
   */
  theseAccts: async (field, { rawTable:row }, set = false) => {
    row = row[0]
    let accts = await t.getv(field)
    if (set && !accts) accts = field == 'accts' ? {} : []
    if (!set) assert.isNotNull(accts, `missing ${field} array in store`) // accts has no length, so it might have extra accounts, which is fine
    let me, name, agent
    for (let i in row) {
      me = w.accounts[row[i]]
//      console.log('stored', field, 'i',i,'rowi',row[i],'choice',accts[i])
      if (field == 'accts') {
        ;([agent, name] = row[i].includes('/') ? row[i].split('/') : ['', me.name])
        if (set) {
          accts[me.accountId] = { hash:u.hash(me.cardCode), data:{ agent:agent, name:name, location:me.location, limit:200, creditLine:9999 } }
        } else t.test(u.just('agent name', accts[me.accountId].data), { agent:agent, name:name })
      } else { // choices
        if (set) {
          accts.push(u.just('accountId deviceId qr isCo name selling', me))
        } else t.test(u.just('accountId isCo name selling', accts[i]), u.just('accountId isCo name selling', me))
      }
    }
    if (set) await t.putv(field, accts)
  },

  onPage: async (id) => {
    const el = await w.page.$(`#${id}`)
    if (el == null) {
      const here = await t.whatPage()
      assert.isNotNull(el, `page "${id}" not found. You are on page "${here}"`)
    }
  },

  see: async (testId) => {
    const el = await t.element(testId)
    assert.isNotNull(el)
    return el // this is required (I don't know why)
  },

  seeIs: async (testId, want, mode = 'exact') => {
    const gotEl = await t.see(testId)
    const got = await gotEl.evaluate(el => el.textContent)
    t.test(got, want, null, mode)
  },

  dontSee: async (testId) => { assert.isNull(await t.element(testId), "shouldn't see" + testId) },

  signedInAs: async (who, set = false) => {
    const me = w.accounts[who]
    if (set) await t.putv('myAccount', { ...u.just('name isCo accountId deviceId selling', me), qr:'qr' + me.name.substring(0, 1) })
    if (!set) t.test(u.just('name isCo accountId selling', await t.getv('myAccount')), u.just('name isCo accountId selling', me))
  }

}

export default t
