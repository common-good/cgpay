import { assert, expect } from 'chai'

const baseUrl = 'http://localhost:3000/'
const storeKey = 'cgpay.test'

/**
 * Get all stored values (the storage state)
 * @param {*} w: the world object (persistent data for an entire run of tests, passed as "this" from step functions)
 *               -- passed to most support functions, so definition not repeated
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
  const st = await getStore(w.page)
  return st[k]
}

async function putv(w, k, v) {
  const st = await getStore(w.page)
  st[k] = v
  await putStore(w.page, st)
}

async function visit(w, target) {
  const visit = await w.page.goto(baseUrl + target, { waitUntil:['networkidle0'] })
  return visit
}

async function onPage(w, id) {
  const el = await w.page.$('#' + id)
  if (el == null) await w.page.screenshot({ path: 'found.png' })
  assert.isNotNull(el, `page "${id}" not found (see page found in found.png)`)
}

async function element(w, testId) { 
  const el = await w.page.$(sel(testId))
  return el
}

function sel(testId) { return `[data-testid|="${testId}"]` }

export { sel, visit, onPage, element, getStore, putStore, getv, putv }
