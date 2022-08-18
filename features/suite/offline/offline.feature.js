import { test, expect } from '@playwright/test'

import createRootScreen from '../root.screen.js'

// --------------------------------------------

test('I can see when the app is offline and when connection is restored.', async ({ page }) => {
  const root = createRootScreen(page)

  // --------------------------------------------
  // Check that the network status banner displays properly
  // when offline.

  await root.visit()
  await expect(root.element('networkStatus')).not.toBeVisible()

  await root.loseConnection()
  await expect(root.element('networkStatus')).toBeVisible()
  await expect(root.element('networkStatus')).toContainText('offline')

  await root.restoreConnection()
  await expect(root.element('networkStatus')).toBeVisible()
  await expect(root.element('networkStatus')).toContainText('online')

  // --------------------------------------------
  // After a connection is restored, check that the banner disappears
  // after 3 seconds.

  await page.waitForTimeout(2900)
  await expect(root.element('networkStatus')).toBeVisible()

  await page.waitForTimeout(100)
  await expect(root.element('networkStatus')).not.toBeVisible()
})
