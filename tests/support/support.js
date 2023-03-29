import { assert, expect } from 'chai'
import queryString from 'query-string'
import c from '../../constants.js'
import w from './world.js'

const baseUrl = 'http://localhost:' + c.port + '/'

const t = {

  // UTILITY FUNCTIONS

  setupPage: async () => {
    if (w.page) return

    const [headless, slowMo] = process.env.CIRCLECI ? [true, 0] : [true, 0]
    w.browser = await w.driver.launch({ headless, slowMo })
    w.page = await w.browser.newPage()
    //  w.page.setViewport({ width: 1280, height: 1024 })
    
    if (c.seeLog) w.page.on('console', async e => { // log whatever the page logs
      const args = await Promise.all(e.args().map(a => a.jsonValue()))
      if (args.length > 1 || typeof args[0] != 'string' 
        || (!args[0].includes('was created with unknown prop') && !args[0].includes('[vite] connect'))) console.log(...args)
    })
  },

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
    const here = await t.whatPage()
    await w.page.evaluate((k, v) => {
      localStorage.setItem(k, JSON.stringify(v))
    }, c.storeKey, st)
    await t.visit('update-state')
    if (here) await t.visit(here)
  },

  getv: async (k) => {
    const st = await t.getStore()
    return st ? null : st[k]
  },

  putv: async (k, v) => {
    let st = await t.getStore()
    if (st == null) st = {}
    st[k] = t.clone(v)
    await t.putStore(st)
  },

  these: ({ rawTable:rows }, one ) => {
//    console.log('rows:', rows)
    let v = []
    if (one) t.test(rows.length, 2)
    for (let rowi = 1; rowi < rows.length; rowi++) {
      v[rowi - 1] = []
      for (let coli in rows[0]) v[rowi - 1][rows[0][coli]] = t.adjust(rows[rowi], coli)
    }
//    console.log('these:', one ? v[0] : v)
    return t.clone(one ? v[0] : v)
  },

  /**
   * Return value or value[k] with adjustments for special parameters, including:
   * %now: current millisecond
   */
  adjust: (value, k) => {
    let v = typeof value === 'object' ? value[k] : value
    if (v == '%now') v = t.now()
    return v
  },

  /**
   * Test whether what we got equals (or sort of equals) what we wanted.
   * If mode is not specified, time fields are compared loosely (within a couple seconds)
   * @param {*} got 
   * @param {*} want: what is wanted (recurses if want is an object)
   * @param {*} mode: exact (default), part, or <n (meaning got and want are less than n apart) 
   */
  test: (got, want, mode = null) => {
    if (typeof want === 'object') {
      assert.isNotNull(got, 'should not be null')
      t.test(typeof got, 'object')
      t.test(got.length, want.length)
      let modei
      for (let i in want) {
        modei = mode == null ? (t.isTimeField(i) ? '<2000' : null) : mode
        t.test(got[i], want[i], modei)
      }
      return
    }

    const msg = `got: ${got} wanted: ${want}`
    if (mode == 'exact' || mode == null) {
      assert.equal(got, want, msg)
     } else if (mode == 'part') {
      assert.include(got, want, msg)
    } else if (mode.substring(0) == '<') {
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
  },

  setUA: async (browser, sys) => {
    let agent = ''
    if (sys == 'Apple' && browser == 'Safari') agent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/36.0  Mobile/15E148 Safari/605.1.15'
    if (sys == 'Android' && browser == 'Chrome') agent = 'Mozilla/5.0 (Linux; Android 11; SM-T227U Build/RP1A.200720.012; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/87.0.4280.141 Safari/537.36'
    await w.page.setUserAgent(agent)
  },

  post: async (op, args = null) => {
    await w.page.setRequestInterception(true)
    await w.page.once('request', async (interceptedRequest ) => {
      try {
        const data = {
          'method': 'POST',
          'postData': queryString.stringify({ version:c.version, op:op, args:args }),
          'headers': { 'Content-type':'application/x-www-form-urlencoded' },
          'mode': 'no-cors'
        }
        interceptedRequest.continue(data)
      } catch (er) {
        console.log('Error while request interception', er)
      }
    })
    const res = await w.page.goto(c.apis.test + 'test')
    await w.page.setRequestInterception(false)
    return res
  },

  input: async (id, text) => { await w.page.$eval(t.sel(`input-${id}`), (el, txt) => el.value = txt, text) },

  // TEST

  /**
   * Compare a set of stored records we have with what was expected.
   * @param string k: key to value in store to test
   * @param {*} multi: gherkin array of arrays representing records to store
   *                   first row is a list of field names, subsequent rows are the field values
   * @param bool one: true to test just the first record rather than an array of records
   */
  testThese: async (k, multi, one = false) => {
//    console.log('in testThese k:', k, 'multi:', multi, 'one:', one, 'store(k):', await t.getv('comments'))
    t.test(await t.getv(k), t.these(multi, one))
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
    return el
  },

  seeIs: async (testId, want, mode = 'exact') => {
    const gotEl = await t.see(testId)
    const got = await gotEl.evaluate(el => el.textContent)
    t.test(got, want, mode)
  },

}

export default t
