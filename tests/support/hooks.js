import { setDefaultTimeout, After, Before, BeforeAll, AfterAll } from '@cucumber/cucumber'
import puppeteer from 'puppeteer'
import queryString from 'query-string'
import { exec } from 'node:child_process'
import w from './world.js' // the world
import c from '../../constants.js'
import t from './support.js' // test support utilities

setDefaultTimeout(w.testTimeout * 1000)

BeforeAll(async () => { // before the whole group of tests (NPM test @whatever)
// fails  exec('NPM RUN DEV', function(err, stdout, stderr) { console.log(stdout) })
})

Before(async () => { // before each scenario
  const ci = process.env.CIRCLECI // headless and fast when doing continuous integration
  const launchOptions = {
    headless: ci ? true : w.headlessMode,
    slowMo: ci ? 0 : w.slowMo,
    args: ['--remote-debugging-port=9222'], // allows use of chrome's remote debugging (see https://www.browserless.io/blog/2019/02/26/puppeteer-debugging)
//    ignoreDefaultArgs: ['--disable-extensions'],
  }
  if (w.chromiumPath) launchOptions.executablePath = w.chromiumPath
  
  w.browser = await puppeteer.launch(launchOptions) // recreate for each scenario, otherwise page doesn't get fully cleared
//  w.fetcher = await w.browser.newPage() // for fetching done just for test purposes
  w.page = await w.browser.newPage()
  w.fetcher = w.page
//  w.page.setViewport({ width: 1280, height: 1024 })

  w.page.exposeFunction('fromTester', t.tellApp) // tell store to update cache (after we changed localStorage -- see t.putStore)
//  w.page.exposeFunction('mockFetch', mockFetch) // tell utils to mock fetches (keep this line)

  if (w.seeLog) w.page.on('console', async e => { // log whatever the page logs
    const args = await Promise.all(e.args().map(a => a.jsonValue()))
    if (args.length > 1 || typeof args[0] != 'string' 
      || (!args[0].includes('was created with unknown prop') && !args[0].includes('[vite] connect'))) console.log(...args)
  })

  try { // initialize API for tests (must happen before initializing store)
    await postToTestEndpoint('initialize')
  } catch (er) { console.log('error initializing API:', er) }  

  await t.visit('empty') // required before putStore
  await t.putStore(null) // have nothing in localStorage until we set it explicitly or visit a page
  w.tellApp = false
})

After(async () => { 
  w.browser.close().then() // this crashes if no tests are found and you use "await" (trying to catch the error fails)
})

AfterAll(async () => { })

/**
 * Post to the "test" endpoint.
 * @param string op: the specific operation
 * @param {*} args: parameters to that operation
 * @returns a JSON object just like other POST endpoints
 */
async function postToTestEndpoint(op, args = null) {
  const options = {
    method: 'POST',
    body: queryString.stringify({ version:c.version, op:op, args:args }),
    headers: { 'Content-type':'application/x-www-form-urlencoded' },
  }
  return await mockFetch(c.apis.test + 'test', options)
}

/**
 * Mock fetches or use the "test" endpoint (see postToTestEndpoint). Interface matches JS fetch interface.
 * NOTE: Making API calls when this function was called as a mock fetch did not work (no connection to internet?)
 * @param string url 
 * @param {*} options 
 * @returns the result
 */
async function mockFetch(url, options = {}) {
  options = { ...options, mode:'cors', postData:options.body }
  const keysToDelete = 'signal body'.split(' ')
  for (let i in keysToDelete) delete options[keysToDelete[i]]

  await w.fetcher.setRequestInterception(true)
  await w.fetcher.once('request', async (interceptedRequest ) => {
    try {
      interceptedRequest.continue(options)
    } catch (er) { console.log('Error while intercepting request', er) }
  })
  let res
  try {
    res = await w.fetcher.goto(url)
  } catch (er) { console.log('Error while mock fetching', er)}
  await w.fetcher.setRequestInterception(false)
//  await w.fetcher.close()
  return res
}
