const { Given, When, Then } = require("@cucumber/cucumber")
const { expect } = require('@playwright/test')

When('context', async function () {
  const pw = await this.pw()
  this.browser = pw.browser
  this.context = pw.context
  this.page = pw.page
})

When('I visit {string}', async function (site) {
  await this.page.goto('https://' + site)
})

Then('? the page title is {string}', async function (wantTitle) {
  const gotTitle = await this.page.title()
  expect(gotTitle).toEqual(wantTitle);
})
