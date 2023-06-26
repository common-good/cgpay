import { setDefaultTimeout, After, Before, BeforeAll, AfterAll } from '@cucumber/cucumber'
import puppeteer from 'puppeteer'
import { exec } from 'node:child_process'
import w from './world.js' // the world
import t from './support.js' // test support utilities
import cache0 from '../../src/cache.js'

setDefaultTimeout(w.testTimeout * 1000)

BeforeAll(async () => { // before the whole group of tests (NPM test @whatever)
// fails  exec('NPM RUN DEV', function(err, stdout, stderr) { console.log(stdout) })
})

Before(async () => { // before each scenario
  w.reset() // reinitialize test variables
  const ci = process.env.CIRCLECI // headless and fast when doing continuous integration
  const launchOptions = {
    headless: ci ? true : w.headlessMode,
    slowMo: ci ? 0 : w.slowMo,
    args: ['--remote-debugging-port=9222'], // allows use of chrome's remote debugging (see https://www.browserless.io/blog/2019/02/26/puppeteer-debugging)
  //    ignoreDefaultArgs: ['--disable-extensions'],
  }
  if (w.chromiumPath) launchOptions.executablePath = w.chromiumPath

  w.browser = await puppeteer.launch(launchOptions) // recreate for each scenario, otherwise page doesn't get fully cleared
  w.fetcher = await w.browser.newPage() // for fetching done just for test purposes (must be different from w.page)
  w.page = await w.browser.newPage()
  //  w.page.setViewport({ width: 1280, height: 1024 })

  w.page.exposeFunction('testerPipe', t.appPipe) // to communicate between tests and app
  //  w.page.exposeFunction('mockFetch', mockFetch) // tell utils to mock fetches (keep this line)

  if (w.seeLog) w.page.on('console', async e => { // log whatever the page logs
    const args = await Promise.all(e.args().map(a => a.jsonValue()))
    if (args.length > 1 || typeof args[0] != 'string' 
      || (!args[0].includes('was created with unknown prop') && !args[0].includes('[vite] connect'))) console.log(...args)
  })
  
  await t.postToTestEndpoint('initialize') // initialize data on the server (real or fake)
  await t.visit('empty') // a page is required before app can save anything to localStorage
  w.tellApp = [{ k:'clear', v:{ ...w.store } }] // synchronize data between tester and app
})

After(async () => { 
  w.browser.close().then() // this crashes if no tests are found and you use "await" (trying to catch the error fails)
})

AfterAll(async () => { })
