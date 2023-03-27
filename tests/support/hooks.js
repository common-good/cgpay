import { setDefaultTimeout, After, Before, BeforeAll, AfterAll } from '@cucumber/cucumber'
import puppeteer from 'puppeteer'
import fkill from 'fkill'
import { exec } from 'node:child_process'
import w from './world.js' // the world
import c from '../../constants.js'
import t from './support.js' // test support utilities

setDefaultTimeout(c.testTimeoutMs)

BeforeAll(async () => {
  exec('npm run dev')

  const ci = process.env.CIRCLECI // headless and fast when doing continuous integration
  const launchOptions = {
    headless: ci ? true : c.headlessMode,
    slowMo: ci ? 0 : c.slowMo
  }
  if (c.chromiumPath) launchOptions.executablePath = c.chromiumPath

  w.browser = await puppeteer.launch(launchOptions)
  w.page = await w.browser.newPage()
  //  w.page.setViewport({ width: 1280, height: 1024 })
  
  if (c.seeLog) w.page.on('console', async e => { // log whatever the page logs
    const args = await Promise.all(e.args().map(a => a.jsonValue()))
    if (args.length > 1 || typeof args[0] != 'string' 
      || (!args[0].includes('was created with unknown prop') && !args[0].includes('[vite] connect'))) console.log(...args)
  })
})

Before(async () => {
  await t.setupPage()
  try { // initialize API for tests (must happen before initializing store)
    await t.post('initialize')
  } catch (er) { console.log(er); assert(false, 'failed to initialize test data')  }  

  await t.visit('update-state') // required before putStore
  await t.putStore(null) // have nothing in localStorage until we set it explicitly or visit a page
  await t.visit('update-state') // reload store with defaults
})

After(async () => {

})

AfterAll(async () => {
  if (w.browser) await w.browser.close()
//  await fkill(':3000')
})
