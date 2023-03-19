const { Given, When, Then } = require("@cucumber/cucumber")
const { expect } = require('@playwright/test')

When('context', async function () {
  const pw = await this.pw()
  this.browser = pw.browser
  this.context = pw.context
  this.page = pw.page
})

When('I visit {string}', async function (site) {
  await this.page.goto('https://app.commongood.earth' + site)
})

When('I click {string}', async function(testId) {
  const button = await this.page.getByTestId(testId);
  button.click();
})

Given('my device is {string}', async function (string) {

})

Then('? the page title is {string}', async function (wantTitle) {
  const gotTitle = await this.page.title()
  expect(gotTitle).toEqual(wantTitle);
})

/* Not Passing */
// Then('? I see installation instructions for {string}', async function (string) {
//   const instructions = await this.page.getByTestId(string);
//   console.log("instructions: ", instructions)
//   expect(instructions).toBeVisible();
// });
