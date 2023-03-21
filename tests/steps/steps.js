import { Given, When, Then } from '@cucumber/cucumber'
import { visit, onPage, element, getStore, putStore } from '../support/support.js'
import { assert, expect } from 'chai'

Given('context', async function () {
  let headless = true // Defines whether puppeteer runs Chrome in headless mode.
  let slowMo = 5
  if (process.env.CIRCLECI) { headless = true; slowMo = 0 } // set Chrome to run headlessly and with no slowdown in CircleCI

  if (!this.browser)	{
    this.browser = await this.driver.launch({ headless, slowMo })
    this.page = await this.browser.newPage()
  //  this.page.setViewport({ width: 1280, height: 1024 })
  }
  await visit(this, 'before-tests') // required before putStore
  await putStore(this, null) // have nothing in localStorage until we set it explicitly or visit a page
})

Given('I use {string} on an {string} device', async function (browser, sys) {
//  await this.page.screenshot({ path: 'zot0.png' })
  let agent = ''
  if (sys == 'Apple' && browser == 'Safari') agent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/36.0  Mobile/15E148 Safari/605.1.15'
  if (sys == 'Android' && browser == 'Chrome') agent = 'Mozilla/5.0 (Linux; Android 11; SM-T227U Build/RP1A.200720.012; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/87.0.4280.141 Safari/537.36'
  await this.page.setUserAgent(agent)
})

When('I run the app', async function () { await visit(this, '') })

When('I visit {string}', async function (site) { await visit(this, site) })

When('I click {string}', async function(testId) {
  const button = await element(this, testId);
  button.click();
})

Then('? I am on page {string}', async function (page) { await onPage(this, page) })

Then('? I see installation instructions for {string}', async function (testId) {
  const el = await element(this, testId)
  assert.isNotNull(el)
})

/*
Then('? the page title is {string}', async function (wantTitle) {
  const gotTitle = await this.page.title()
  expect(gotTitle).toEqual(wantTitle)
})
*/