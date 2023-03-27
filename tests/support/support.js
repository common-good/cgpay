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

  sel: (testId) => { return `[data-testid="${testId}"]` },

  // MAKE / DO

  visit: async (target) => { return await w.page.goto(baseUrl + target) }, // , { waitUntil:['networkidle0'] }

  /**
   * 
   * @param string k: key to value in store to store 
   * @param {*} rows: gherkin array of arrays representing records to store
   *                  first row is a list of field names, subsequent rows are the field values
   * @param bool one: true to store just the first record rather than an array of records
   */
  setThese: async (k, { rawTable:rows }, one = false) => {
    let v = []
    if (one) assert.equal(rows.length, 2, `too many records storing value "${k}"`)
    for (let rowi = 1; rowi < rows.length; rowi++) {
      v[rowi - 1] = []
      for (let coli in rows[0]) v[rowi - 1][rows[0][coli]] = rows[rowi][coli]
    }
    await t.putv(k, one ? v[0] : v)
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
    await w.page.goto(c.apis.test + 'test')
    await w.page.setRequestInterception(false)
  },

  input: async (id) => {
    await w.page.$eval(t.sel(id), el => el.value = 'not empty string');
  },

  // TEST

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
    assert.isNotNull(el)
    return el
  },

  seeIs: async (testId, want, partial = false) => {
    const gotEl = await t.see(testId)
    const got = await gotEl.evaluate(el => el.textContent)
    assert.isTrue(partial ? got.includes(want) : (got == want))
  },

  element: async (testId) => { return await w.page.$(t.sel(testId)) },

}

export default t
