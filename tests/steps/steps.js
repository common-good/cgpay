import { Given, When, Then } from '@cucumber/cucumber'
import scope from '../support/scope.js'
import constants from '../support/constants.js'
import { sel, visit, onPage, element, getStore, putStore, putv } from '../support/support.js'
import { assert, expect } from 'chai'

const { seeLog } = constants

/**
 * Include this function first in the Background for each Feature
 * See features/background.txt for temporary implicit background in Release "A"
 */
Given('context', async function () {
  await visit('before-tests') // required before putStore
  await putStore({}) // initialize empty store on localStorage

  if (seeLog) {
    scope.page.on('console', async e => { // log whatever the page logs
      const args = await Promise.all(e.args().map(a => a.jsonValue()))
      if (args.length > 1 || typeof args[0] != 'string' || !args[0].includes('was created with unknown prop')) {
        console.log(...args)
      }
    })
  }
})

Given('I use {string} on an {string} device', async function (browser, sys) {
  let agent = ''
  if (sys == 'Apple' && browser == 'Safari') agent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/36.0  Mobile/15E148 Safari/605.1.15'
  if (sys == 'Android' && browser == 'Chrome') agent = 'Mozilla/5.0 (Linux; Android 11; SM-T227U Build/RP1A.200720.012; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/87.0.4280.141 Safari/537.36'
  await scope.page.setUserAgent(agent)
})

When('I run the app', async function () { await visit('') })

When('I visit {string}', async function (path) { await visit(path) })

When('I click {string}', async function(testId) {
  await scope.page.click(sel(testId))
  await scope.page.title() // wait for page to load
})

Then('? I am on page {string}', async function (page) { await onPage(page) })

Then('? I see installation instructions for {string}', async function (testId) {
  const el = await element(testId + '-instructions')
  assert.isNotNull(el)
})

/*
Then('? the page title is {string}', async function (wantTitle) {
  const gotTitle = await this.page.title()
  expect(gotTitle).toEqual(wantTitle)
})
*/