import { test, expect } from '@playwright/test'

import createAddScreen from './add-to-home-screen.screen.js'
import createSignInScreen from '../sign-in/sign-in.screen.js'

// --------------------------------------------
// Shared Assertions

async function expectAbleToSkip({ addScreen, signIn }) {
  // After skipping the instructions, display the Pay screen.
  await addScreen.skipHomeScreenPrompt()
  await expect(addScreen.root()).not.toBeVisible()
  await expect(signIn.root()).toBeVisible()

  // When the instructions are skipped, don't display them again.
  await signIn.visit()
  await expect(addScreen.root()).not.toBeVisible()
  await expect(signIn.root()).toBeVisible()
}

// --------------------------------------------
// As a vendor,
// I can add the CGPay app to my mobile home screen
// so that it is easy to access.

test('I am guided to add the app to my home screen before collecting payment for the first time on an Apple device.', async ({ browser }) => {
  const context = await browser.newContext({ userAgent: 'iPhone' })
  const page = await context.newPage()

  const signIn = createSignInScreen(page)
  const addScreen = createAddScreen(page)

  // When visiting the app for the first time, display the home
  // screen instructions.
  await page.goto('/')
  await expect(signIn.root()).not.toBeVisible()
  await expect(addScreen.root()).toBeVisible()
  await expect(addScreen.element('appleInstructions')).toBeVisible()
  await expect(addScreen.element('androidInstructions')).not.toBeVisible()

  await expectAbleToSkip({ addScreen, signIn })
})

test('I am guided to add the app to my home screen before collecting payment for the first time on an Android device.', async ({ browser }) => {
  const context = await browser.newContext({ userAgent: 'Android' })
  const page = await context.newPage()

  const signIn = createSignInScreen(page)
  const addScreen = createAddScreen(page)

  // When visiting the app for the first time, display the home
  // screen instructions.
  await page.goto('/')
  await expect(signIn.root()).not.toBeVisible()
  await expect(addScreen.root()).toBeVisible()
  await expect(addScreen.element('appleInstructions')).not.toBeVisible()
  await expect(addScreen.element('androidInstructions')).toBeVisible()

  await expectAbleToSkip({ addScreen, signIn })
})

test('I am not prompted to add the app to my home screen when not on a mobile device.', async ({ page }) => {
  const signIn = createSignInScreen(page)
  const addScreen = createAddScreen(page)

  await page.goto('/')
  await expect(signIn.root()).toBeVisible()
  await expect(addScreen.root()).not.toBeVisible()
})
