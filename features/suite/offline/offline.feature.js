import { test, expect } from '@playwright/test'

import createSignInScreen from '../sign-in/sign-in.screen.js'

// --------------------------------------------

test('I can see when the app is offline.', async ({ page }) => {
  const signIn = createSignInScreen(page)

  // Check that the network status banner displays properly.
  await signIn.visit()
  await expect(signIn.element('root')).toBeVisible()
  await expect(signIn.element('networkStatus')).not.toBeVisible()

  await signIn.loseConnection()
  await expect(signIn.element('networkStatus')).toBeVisible()
  await expect(signIn.element('networkStatus')).toContainText('offline')

  await signIn.restoreConnection()
  await expect(signIn.element('networkStatus')).toBeVisible()
  await expect(signIn.element('networkStatus')).toContainText('online')

  // After a connection is restored, check that the banner disappears
  // after 3 seconds.
  await page.waitForTimeout(2900)
  await expect(signIn.element('networkStatus')).toBeVisible()

  await page.waitForTimeout(100)
  await expect(signIn.element('networkStatus')).not.toBeVisible()
})
