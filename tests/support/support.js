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

  whatpage: async () => { 
    const el = await w.page.$('.content')
    return el ? await w.page.$eval( '.content', el => getAttribute('id') ) : null
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
    const here = await t.whatpage()
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
    st[k] = typeof v == 'object' ? { ...v } : v
    await t.putStore(st)
  },

  these: ({ rawTable:rows }, one ) => {
    let v = []
    if (one) assert.equal(rows.length, 2, `too many records testing value "${k}"`)
    for (let rowi = 1; rowi < rows.length; rowi++) {
      v[rowi - 1] = []
      for (let coli in rows[0]) v[rowi - 1][rows[0][coli]] = fix(rows, rowi, coli)
    }
    return one ? v[0] : v
  },

  /**
   * Return row[coli] with adjustments for special parameters, including:
   * %now: current millisecond
   */
  fix: (row, coli) {
    let v = row[coli]
    if (v == '%now') v = now()
    return v
  },

  test: (got, want, mode = 'exact') => {
    if (typeof want === 'object') {
      for (let i in want) t.test(got[i], fix(want, i))
      return
    }
    const msg = `got: ${got} wanted: ${want}`
    if (mode == 'exact') {
      assert.equal(got, want, msg)
     } else if (mode == 'part') {
      assert.include(got, want, msg)
    } else if (typeof mode === 'number') {
      assert.isBelow(Math.abs(got - want), mode, msg)
    } else assert.fail('bad mode:' + mode)
  },

  element: async (testId) => { return await w.page.$(t.sel(testId)) },
  sel: (testId) => { return `[data-testid="${testId}"]` },

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
    const v = these(multi, one)
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

  input: async (id, text) => { await w.page.$eval(t.sel(id), (el, txt) => el.value = txt, text) },

  // TEST

  /**
   * 
   * @param string k: key to value in store to test
   * @param {*} multi: gherkin array of arrays representing records to store
   *                   first row is a list of field names, subsequent rows are the field values
   * @param bool one: true to test just the first record rather than an array of records
   */
  testThese: async (k, multi, one = false) => {
    const got = await t.getv(k)
    let v = these(multi, one)
    if (one) return test(got, v)
    test(typeof got, 'object')
    test(got.length, v.length)
    for (let i in v) test(got[i], v[i])
  },

  onPage: async (id) => {
    const el = await w.page.$('#' + id)
    if (el == null) await w.page.screenshot({ path: 'found.png' })
    if (el == null) {
      const title = await w.page.title()
      assert.isNotNull(el, `page "${id}" not found. You are on page "${title}" (see page found in found.png).`)
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
    test(got, want, mode)
  },

}

export default t
