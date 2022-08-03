import { test, expect } from '@playwright/test'

import createPayScreen from './pay.screen.js'
import createHomeScreenInstructionsScreen from './home-screen-instructions.screen.js'

// --------------------------------------------
// Shared Assertions

async function expectAbleToSkip({ homeScreenInstructions, pay }) {
  // After skipping the instructions, display the Pay screen.
  await homeScreenInstructions.skipHomeScreenPrompt()
  await expect(homeScreenInstructions.element('root')).not.toBeVisible()
  await expect(pay.element('root')).toBeVisible()

  // When the instructions are skipped, don't display them again.
  await pay.visit()
  await expect(homeScreenInstructions.element('root')).not.toBeVisible()
  await expect(pay.element('root')).toBeVisible()
}

// --------------------------------------------
// As a vendor,
// I can add the CGPay app to my mobile home screen
// so that it is easy to access.

test('I am guided to add the app to my home screen before collecting payment for the first time on an Apple device.', async ({ browser }) => {
  const context = await browser.newContext({ userAgent: 'iPhone' })
  const page = await context.newPage()

  const pay = createPayScreen(page)
  const homeScreenInstructions = createHomeScreenInstructionsScreen(page)

  // When visiting the app for the first time, display the home
  // screen instructions.
  await pay.visit()
  await expect(pay.element('root')).not.toBeVisible()
  await expect(homeScreenInstructions.element('root')).toBeVisible()
  await expect(homeScreenInstructions.element('appleInstructions')).toBeVisible()
  await expect(homeScreenInstructions.element('androidInstructions')).not.toBeVisible()

  await expectAbleToSkip({ homeScreenInstructions, pay })
})

test('I am guided to add the app to my home screen before collecting payment for the first time on an Android device.', async ({ browser }) => {
  const context = await browser.newContext({ userAgent: 'Android' })
  const page = await context.newPage()

  const pay = createPayScreen(page)
  const homeScreenInstructions = createHomeScreenInstructionsScreen(page)

  // When visiting the app for the first time, display the home
  // screen instructions.
  await pay.visit()
  await expect(pay.element('root')).not.toBeVisible()
  await expect(homeScreenInstructions.element('root')).toBeVisible()
  await expect(homeScreenInstructions.element('appleInstructions')).not.toBeVisible()
  await expect(homeScreenInstructions.element('androidInstructions')).toBeVisible()

  await expectAbleToSkip({ homeScreenInstructions, pay })
})

test('I am not prompted to add the app to my home screen when not on a mobile device.', async ({ page }) => {
  const pay = createPayScreen(page)
  const homeScreenInstructions = createHomeScreenInstructionsScreen(page)

  await pay.visit()
  await expect(pay.element('root')).toBeVisible()
  await expect(homeScreenInstructions.element('root')).not.toBeVisible()
})
