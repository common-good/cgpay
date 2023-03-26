import { Given, When, Then } from '@cucumber/cucumber'
import t from '../support/support.js'
import w from '../support/world.js'
import { assert, expect } from 'chai'

Given('I use {string} on an {string} device', async function (browser, sys) {
  let agent = ''
  if (sys == 'Apple' && browser == 'Safari') agent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/36.0  Mobile/15E148 Safari/605.1.15'
  if (sys == 'Android' && browser == 'Chrome') agent = 'Mozilla/5.0 (Linux; Android 11; SM-T227U Build/RP1A.200720.012; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/87.0.4280.141 Safari/537.36'
  await w.page.setUserAgent(agent)
})

When('I run the app', async function () { await t.visit('') })

When('I visit {string}', async function (site) { await t.visit(site) })

When('I click {string}', async function(testId) {
  await w.page.click(t.sel(testId))
  await w.page.title() // wait for page to load
})

Then('? I am on page {string}', async function (page) { await t.onPage(page) })

Then('? I see installation instructions for {string}', async function (testId) {
  const el = await t.element(testId + '-instructions')
  assert.isNotNull(el)
})

/*
Then('? the page title is {string}', async function (wantTitle) {
  const gotTitle = await w.page.title()
  expect(gotTitle).toEqual(wantTitle)
})
*/