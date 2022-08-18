import { test, expect } from '@playwright/test'

import createAddScreen from './add-to-home-screen.screen.js'
import createRootScreen from '../root.screen.js'
import createSignInScreen from '../sign-in/sign-in.screen.js'

// --------------------------------------------
// Shared Assertions

async function expectAbleToSkip({ addScreen, root, signIn }) {
  // After skipping the instructions, display the Pay screen.
  await addScreen.skipHomeScreenPrompt()
  await expect(addScreen.root()).not.toBeVisible()
  await expect(signIn.root()).toBeVisible()

  // When the instructions are skipped, don't display them again.
  await root.visit()
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

  const addScreen = createAddScreen(page)
  const root = createRootScreen(page)
  const signIn = createSignInScreen(page)

  // When visiting the app for the first time, display the home
  // screen instructions.
  await root.visit()
  await expect(signIn.root()).not.toBeVisible()
  await expect(addScreen.root()).toBeVisible()
  await expect(addScreen.element('appleInstructions')).toBeVisible()
  await expect(addScreen.element('androidInstructions')).not.toBeVisible()

  await expectAbleToSkip({ addScreen, root, signIn })
})

test('I am guided to add the app to my home screen before collecting payment for the first time on an Android device.', async ({ browser }) => {
  const context = await browser.newContext({ userAgent: 'Android' })
  const page = await context.newPage()

  const addScreen = createAddScreen(page)
  const root = createRootScreen(page)
  const signIn = createSignInScreen(page)

  // When visiting the app for the first time, display the home
  // screen instructions.
  await root.visit()
  await expect(signIn.root()).not.toBeVisible()
  await expect(addScreen.root()).toBeVisible()
  await expect(addScreen.element('appleInstructions')).not.toBeVisible()
  await expect(addScreen.element('androidInstructions')).toBeVisible()

  await expectAbleToSkip({ addScreen, root, signIn })
})

test('I am not prompted to add the app to my home screen when not on a mobile device.', async ({ page }) => {
  // Test browser is not on a mobile device by default.

  const addScreen = createAddScreen(page)
  const root = createRootScreen(page)
  const signIn = createSignInScreen(page)

  await root.visit()
  await expect(signIn.root()).toBeVisible()
  await expect(addScreen.root()).not.toBeVisible()
})
