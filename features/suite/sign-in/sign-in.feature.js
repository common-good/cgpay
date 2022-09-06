import { test, expect } from '@playwright/test'

import createChargeScreen from '../charge/charge.screen.js'
import createLinkAccountScreen from '../link-account/link-account.screen.js'
import createRootScreen from '../root.screen.js'
import createRoutes from '../routes.js'

import createSignInScreen from './sign-in.screen.js'

// --------------------------------------------
// As a vendor,
// I can sign in with my personal CG account,
// so that I can subsequently link the app to a business account
// and use it to charge customers.

test('I can sign in with my personal CG account.', async ({ browser, context, page }) => {
  // --------------------------------------------
  // Set up mock API endpoints.

  const routes = createRoutes({ page })

  routes.accounts.get
    .withQueryParams({ identifier: 'invalid@email.com', password: 'invalid' })
    .respondsWith(404)

  routes.accounts.get
    .withQueryParams({ identifier: 'valid@email.com', password: 'valid' })
    .respondsWith(200, {
      accounts: [
        {
          cardId: 'card-id',
          deviceId: 'device-id',
          name: 'account-name'
        }
      ]
    })

  // --------------------------------------------

  const linkAccount = createLinkAccountScreen(page)
  const charge = createChargeScreen(page)
  const root = createRootScreen(page)
  const signIn = createSignInScreen(page)

  // --------------------------------------------
  // When not signed in, I see the sign in screen.

  // await charge.visit()
  // await expect(signIn.root()).toBeVisible()

  // --------------------------------------------
  // Check that the network status banner displays properly
  // when offline.

  await signIn.visit()
  await expect(signIn.root()).toBeVisible()
  await expect(root.element('networkStatus')).not.toBeVisible()

  await root.loseConnection()
  await expect(root.element('networkStatus')).toBeVisible()
  await expect(root.element('networkStatus')).toContainText('offline')

  await root.restoreConnection()
  await expect(root.element('networkStatus')).toBeVisible()
  await expect(root.element('networkStatus')).toContainText('online')

  // --------------------------------------------
  // When I submit invalid credentials, I see an error message.

  await signIn.with({ identifier: 'invalid@email.com', password: 'invalid' })
  await expect(signIn.element('errorMessage')).toContainText(`couldn't find`)

  // --------------------------------------------
  // When I submit valid credentials, I am directed to the next step.

  await signIn.with({ identifier: 'valid@email.com', password: 'valid' })
  await expect(signIn.root()).not.toBeVisible()
  await expect(linkAccount.root()).toBeVisible()
})
