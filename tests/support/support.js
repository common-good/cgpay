import { assert, expect } from 'chai'
import constants from './constants.js'
import scope from './scope.js'

const { baseUrl, storeKey } = constants

/**
 * Get all stored values (the storage state)
 * @param {*} w: the world object (persistent data for an entire run of tests, passed as "this" from step functions)
 *               -- passed to most support functions, so definition not repeated
 * @returns {*} st: an object containing all the app's stored values
 */
async function getStore() {
  const st = await scope.page.evaluate((k) =>  localStorage.getItem(k), storeKey)
  return JSON.parse(st)
}

async function putStore(st) {
  await scope.page.evaluate((k, v) => {
    localStorage.setItem(k, JSON.stringify(v))
  }, storeKey, st)
}

async function getv(k) {
  const st = await getStore(w)
  return st[k]
}

async function putv(k, v) {
  const st = await getStore()
  st[k] = v
  await putStore(st)
}

async function visit(path) {
  const visit = await scope.page.goto(baseUrl + path, { waitUntil:['networkidle0'] })
  return visit
}

async function onPage(id) {
  const el = await scope.page.$('#' + id)
  if (el == null) await scope.page.screenshot({ path: 'found.png' })
  assert.isNotNull(el, `page "${id}" not found (see page found in found.png)`)
}

async function element(testId) { 
  const el = await scope.page.$(sel(testId))
  return el
}

function sel(testId) { return `[data-testid="${testId}"]` }

export { sel, visit, onPage, element, getStore, putStore, getv, putv }
