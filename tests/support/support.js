import { assert, expect } from 'chai'
import queryString from 'query-string'
import c from '../../constants.js'
import w from './world.js'

const baseUrl = 'http://localhost:' + c.port + '/'

const t = {

  /**
   * 
   * @param {*} w: the world object (persistent data for an entire run of tests, passed as "this" from step functions)
   *               -- passed to most support functions, so definition not repeated
   */
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

  /**
   * Get all stored values (the storage state)
   * @returns {*} st: an object containing all the app's stored values
   */
  getStore: async () => {
    const st = await w.page.evaluate((key) => localStorage.getItem(key), c.storeKey)
    return st
  },

  putStore: async (st) => {
    await w.page.evaluate((k, v) => {
      localStorage.setItem(k, JSON.stringify(v))
    }, c.storeKey, st)
  },

  getv: async (k) => {
    const st = await t.getStore() || {}
    return st[k]
  },

  putv: async (k, v) => {
    const st = await t.getStore() || {}
    st[k] = v
    await t.putStore(st)
  },

  visit: async (target) => {
    const visit = await w.page.goto(baseUrl + target, { waitUntil:['networkidle0'] })
  //  console.log('visiting:', target)
    return visit
  },

  onPage: async (id) => {
    const el = await w.page.$('#' + id)
    if (el == null) await w.page.screenshot({ path: 'found.png' })
    if (el == null) {
      const title = await w.page.title()
      assert.isNotNull(el, `page "${id}" not found. You are on page "${title}" (see page found in found.png).`)
    }
  },

  element: async (testId) => { 
    const el = await w.page.$(sel(testId))
    return el
    }
    console.log(k, v)
    await t.putv(k, one ? v[0] : v)
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

}

export default t
