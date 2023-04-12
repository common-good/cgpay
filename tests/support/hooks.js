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
  
  await t.postToTestEndpoint('initialize')
  await t.visit('empty') // required before putStore
  await t.putStore(null) // have nothing in localStorage until we set it explicitly or visit a page
  w.tellApp = false
})

After(async () => { 
  w.browser.close().then() // this crashes if no tests are found and you use "await" (trying to catch the error fails)
})

AfterAll(async () => { })
