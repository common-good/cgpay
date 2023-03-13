const { Given, When, Then } = require("@cucumber/cucumber")
const { expect } = require('@playwright/test')

const site = 'app.commongood.earth'

When('context', async function () {
  const pw = await this.pw()
  this.browser = pw.browser
  this.context = pw.context
  this.page = pw.page
})

Given('I visit CGPay online', async function (site) {
  await this.page.goto('https://' + site)
})

When('I have not been prompted to add the app to my home screen', async() => {
  // canAddToHomeScreen is true
})

Then('? I am prompted to install the app to my home screen', async function () {
  const gotTitle = await this.page.title()
  expect(gotTitle).toEqual('CGPay - Add to Home Screen');
})

When('I have previously been prompted to add the app to my home screen', async() => {
  // canAddToHomeScreen is false
})

Then('? I am directed to the sign-in page', async function () {
  const gotTitle = await this.page.title()
  expect(gotTitle).toEqual('CGPay - Sign In');
})