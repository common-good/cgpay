import { assert, expect } from 'chai'
import queryString from 'query-string'
import vite from '../../vite.config.js'

const version = JSON.parse(vite.define._version_)
const storeKey = JSON.parse(vite.define._storeKey_)
const testApi = JSON.parse(vite.define._apis_)['test']
const baseUrl = 'http://localhost:' + vite.server.port + '/'
const seeLog = true // show what the app logs to console

/**
 * 
 * @param {*} w: the world object (persistent data for an entire run of tests, passed as "this" from step functions)
 *               -- passed to most support functions, so definition not repeated
 */
async function setupPage(w) {
  if (w.page) return

  const [headless, slowMo] = process.env.CIRCLECI ? [true, 0] : [true, 0]
  w.browser = await w.driver.launch({ headless, slowMo })
  w.page = await w.browser.newPage()
  //  w.page.setViewport({ width: 1280, height: 1024 })
  
  if (seeLog) w.page.on('console', async e => { // log whatever the page logs
    const args = await Promise.all(e.args().map(a => a.jsonValue()))
    if (args.length > 1 || typeof args[0] != 'string' 
      || (!args[0].includes('was created with unknown prop') && !args[0].includes('[vite] connect'))) console.log(...args)
  })
}

/**
 * Get all stored values (the storage state)
 * @returns {*} st: an object containing all the app's stored values
 */
async function getStore(w) {
  const st = await w.page.evaluate((key) => window.localStorage.getItem(key), storeKey)
  return st
}

async function putStore(w, st) {
  await w.page.evaluate((key, value) => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, storeKey, st)
}

async function getv(w, k) {
  const st = await getStore(w)
  return st[k]
}

async function putv(w, k, v) {
  const st = await getStore(w)
  st[k] = v
  await putStore(w.page, st)
}

async function visit(w, target) {
  const visit = await w.page.goto(baseUrl + target, { waitUntil:['networkidle0'] })
//  console.log('visiting:', target)
  return visit
}

async function onPage(w, id) {
  const el = await w.page.$('#' + id)
  if (el == null) await w.page.screenshot({ path: 'found.png' })
  if (el == null) {
    const title = await w.page.title()
    assert.isNotNull(el, `page "${id}" not found. You are on page "${title}" (see page found in found.png).`)
  }
}

async function element(w, testId) { 
  const el = await w.page.$(sel(testId))
  return el
}

function sel(testId) { return `[data-testid|="${testId}"]` }

async function post(w, op, args = null) {
  await w.page.setRequestInterception(true)
  await w.page.once('request', async (interceptedRequest ) => {
    try {
      const data = {
        'method': 'POST',
        'postData': queryString.stringify({ version:version, op:op, args:args }),
        'headers': { 'Content-type':'application/x-www-form-urlencoded' },
        'mode': 'no-cors'
      }
      interceptedRequest.continue(data)
    } catch (er) {
      console.log('Error while request interception', er)
    }
  })
  await w.page.goto(testApi + '/test')
  await w.page.setRequestInterception(false)
}

export default { setupPage, post, sel, visit, onPage, element, getStore, putStore, getv, putv }
