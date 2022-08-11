import { test, expect } from '@playwright/test'

import appContext from '../../context/context.provider.js'
import createLinkAccountScreen from '../link-account/link-account.screen.js'
import createSignInScreen from '../sign-in/sign-in.screen.js'

// --------------------------------------------

test('I can see when the app is offline.', async ({ page }) => {
  // --------------------------------------------
  // Set up mock API endpoints.

  const accountsRoute = appContext('membersApi.location') + '/accounts'
  const businessesRoute = appContext('membersApi.location') + '/businesses'

  await page.route(accountsRoute + '?identifier=valid%40email.com&password=valid', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',

      body: JSON.stringify({
        account: {
          identifier: 'valid@email.com'
        },

        token: 'valid-token'
      })
    })
  })

  await page.route(accountsRoute + '?token=valid-token', route => {
    route.fulfill({
      status: 200
    })
  })

  await page.route(businessesRoute + '?identifier=valid%40email.com', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',

      body: JSON.stringify({
        businesses: [
          { name: 'Business 1' }
        ]
      })
    })
  })

  // --------------------------------------------

  const linkAccount = createLinkAccountScreen(page)
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

  await signIn.with({ identifier: 'valid@email.com', password: 'valid' })

  // Check that the network status banner displays properly.
  await linkAccount.visit()
  await expect(linkAccount.element('root')).toBeVisible()
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
