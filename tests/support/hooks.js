import { BeforeAll, AfterAll, Before, After, setDefaultTimeout } from '@cucumber/cucumber'
import puppeteer from 'puppeteer'
import scope from './scope.js'
import constants from './constants.js'

const { headlessMode, slowMo, chromiumPath, timeoutMs, baseUrl, storeKey } = constants;

BeforeAll(async () => {
  scope.driver = puppeteer

  const launchOptions = {
    headless: headlessMode,
    slowMo: slowMo
  }

  // Can be used to test different versions of chromium
  if (chromiumPath !== '') {
    launchOptions.executablePath = chromiumPath
  }

  // Set browser to run headlessly and with no slowdown in CircleCI
  if (process.env.CIRCLECI) { 
    launchOptions.headless = true
    launchOptions.slowMo = 0 
  } 

  scope.browser = await scope.driver.launch(launchOptions)

  setDefaultTimeout(timeoutMs)

})

Before(async () => {
  scope.page = await scope.browser.newPage()
})

After(async () => {
  await scope.page.close()
})

AfterAll(async () => {
  if (scope.browser) {
    await scope.browser.close()
  }
})