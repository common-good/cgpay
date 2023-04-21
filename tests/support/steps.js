import { Given, When, Then } from '@cucumber/cucumber'
import t from './support.js'
import w from './world.js'
import { assert, expect } from 'chai'

Given('I use {string} on an {string} device', async function (browser, sys) { await t.setUA(browser, sys) })
Given('I am signed in as {string}', async function (who) { await t.signedInAs(who, true) })
Given('I am not signed in', async function () { await t.putv('myAccount', null) })
Given('this {string}:', async function (k, rows) { await t.setThis(k, rows, 1) }) // for myAccount, for example
Given('this {string}: {string}', async function (k, v) { await t.setThis(k, v) })
Given('these {string}:', async function (k, rows) { await t.setThis(k, rows) })
Given('these accounts:', async function (rows) { await t.theseAccts('accts', rows, true) })
Given('these choices:', async function (rows) { await t.theseAccts('choices', rows, true) })
Given('we are offline', async function () { await t.putv('online', false) }) // w.page.setOfflineMode(true) prevents all w.page.goto!
Given('we are online', async function () { await t.putv('online', true) })

When('I run the app', async function () { await t.visit('') })
When('I visit {string}', async function (site) { await t.visit(site) })
When('I click {string}', async function(testId) { await w.page.click(t.sel(testId)) })
When('I scan {string}', async function (who) { await t.scan(who) })
When('I input {string} as {string}', async function (text, inputId) { await t.input(inputId, text) })
When('I charge {string} {float} for {string}', async function (who, amount, description) { await t.tx(who, amount, description) })
When('I wait {float} seconds', async function (secs) { await t.wait(secs) })
When('we wait for uploads', async function () {await t.putv('flushOk', true); await t.wait(1.5) }) // wait(1) is sometimes not enough

Then('? I am signed in as {string}', async function (who) { await t.signedInAs(who) })
Then('? this {string}:', async function (k, rows) { await t.testThis(k, rows) }) // object
Then('? this {string}: {string}', async function (k, v) { await t.testThis(k, v) }) // string or number
Then('? these {string}:', async function (k, rows) { await t.testThese(k, rows) })
Then('? these accounts:', async function (rows) { await t.theseAccts('accts', rows) })
Then('? these choices:', async function (rows) { await t.theseAccts('choices', rows) })
Then('? these server {string}:', async function (table, rows) { await t.testServer(table, rows) })
Then('? count {string} is {int}', async function (list, count) { await t.countIs(list, count) })
Then('? I am on page {string}', async function (page) { await t.onPage(page) })
Then('? I see {string}', async function (testId) { await t.see(testId) })
Then('? {string} is {string}', async function (testId, want) { await t.seeIs(testId, want) })
Then('? {string} is not {string}', async function (testId, want) { await t.seeIs(testId, want, false) })
Then('? {string} is in {string}', async function (want, testId) { await t.seeIs(testId, want, 'part') })
Then('? this error: {string}', async function (msg) { await t.seeIs('messageText', msg, 'part') }) // eventually handle differently: error/alert/confirmation
Then('? this confirmation: {string}', async function (msg) { await t.seeIs('messageText', msg, 'part') })
Then('? this alert: {string}', async function (msg) { await t.seeIs('messageText', msg, 'part') })
Then('? I do not see {string}', async function (testId) { await t.dontSee(testId) })
Then('? we post this to {string}:', async function (endpoint, rows) { await t.posted(endpoint, rows, 'post') })
Then('? we request this from {string}:', async function (endpoint, rows) { await t.posted(endpoint, rows, 'get') })

//========== Debugging Steps =============

Given('snap', async function() { await t.snap() }) // name is "snap"
Given('snap {string}', async function(name) { await t.snap(name) })
