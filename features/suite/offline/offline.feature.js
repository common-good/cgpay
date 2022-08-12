import { test, expect } from '@playwright/test'

import createLinkAccountScreen from '../link-account/link-account.screen.js'
import createRoutes from '../routes.js'
import createSignInScreen from '../sign-in/sign-in.screen.js'

// --------------------------------------------

test('I can see when the app is offline.', async ({ page }) => {
  // --------------------------------------------
  // Set up mock API endpoints.

  const routes = createRoutes({ page })

  await routes.accounts.get
    .withQueryParams({ identifier: 'valid@email.com', password: 'valid' })
    .respondsWith(200, {
      account: {
        identifier: 'valid@email.com'
      },

      token: 'valid-token'
    })

  await routes.accounts.get
    .withQueryParams({ token: 'valid-token' })
    .respondsWith(200)

  await routes.businesses.get
    .withQueryParams({ identifier: 'valid@email.com' })
    .respondsWith(200, {
      businesses: [
        { name: 'Business 1' }
      ]
    })

  // --------------------------------------------

  const linkAccount = createLinkAccountScreen(page)
  const signIn = createSignInScreen(page)

  // Check that the network status banner displays properly.
  await signIn.visit()
  await expect(signIn.root()).toBeVisible()
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

  await signIn.with({ identifier: 'valid@email.com', password: 'valid' })

  // Check that the network status banner displays properly.
  await linkAccount.visit()
  await expect(linkAccount.root()).toBeVisible()
  await expect(linkAccount.element('networkStatus')).not.toBeVisible()

  await page.pause()
  await linkAccount.loseConnection()
  await expect(linkAccount.element('networkStatus')).toBeVisible()
  await expect(linkAccount.element('networkStatus')).toContainText('offline')

  await linkAccount.restoreConnection()
  await expect(linkAccount.element('networkStatus')).toBeVisible()
  await expect(linkAccount.element('networkStatus')).toContainText('online')

  // After a connection is restored, check that the banner disappears
  // after 3 seconds.
  await page.waitForTimeout(2900)
  await expect(linkAccount.element('networkStatus')).toBeVisible()

  await page.waitForTimeout(100)
  await expect(linkAccount.element('networkStatus')).not.toBeVisible()
})
