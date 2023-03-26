import { Given, When, Then } from '@cucumber/cucumber'
import t from '../support/support.js'
import { assert, expect } from 'chai'

/**
 * Include this function first in the Background for each Feature
 * See features/background.txt for temporary implicit background in Release "A"
 */
Given('context', async function () {
  await t.setupPage(this)
  await t.visit(this, 'before-tests') // required before putStore
  await t.putStore(this, null) // have nothing in localStorage until we set it explicitly or visit a page

  try { // initialize API for tests
    await t.post(this, 'initialize')
  } catch (er) { console.log(er); assert(false, 'failed to initialize test data')  }  
})

Given('I use {string} on an {string} device', async function (browser, sys) {
  let agent = ''
  if (sys == 'Apple' && browser == 'Safari') agent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/36.0  Mobile/15E148 Safari/605.1.15'
  if (sys == 'Android' && browser == 'Chrome') agent = 'Mozilla/5.0 (Linux; Android 11; SM-T227U Build/RP1A.200720.012; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/87.0.4280.141 Safari/537.36'
  await this.page.setUserAgent(agent)
})

When('I run the app', async function () { await t.visit(this, '') })

When('I visit {string}', async function (site) { await t.visit(this, site) })

When('I click {string}', async function(testId) {
  await this.page.click(t.sel(testId))
  await this.page.title() // wait for page to load
})

Then('? I am on page {string}', async function (page) { await t.onPage(this, page) })

Then('? I see installation instructions for {string}', async function (testId) {
  const el = await t.element(this, testId + '-instructions')
  assert.isNotNull(el)
})

/*
Then('? the page title is {string}', async function (wantTitle) {
  const gotTitle = await this.page.title()
  expect(gotTitle).toEqual(wantTitle)
})
*/