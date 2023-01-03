import { test, expect } from '@playwright/test'

import createChargeScreen from '../charge/charge.screen.js'
import createLinkAccountScreen from '../link-account/link-account.screen.js'
import createRootScreen from '../root.screen.js'
import createRoutes from '../routes.js'
import createSignInScreen from '../sign-in/sign-in.screen.js'

import createScanScreen from './scan.screen.js'

// --------------------------------------------
// As a vendor,
// I can look up customers by scanning their QR code,
// so that I can charge for goods or services.

test('I can identify a valid account by its QR code.', async ({ page }) => {
  // --------------------------------------------
  // Set up mock API endpoints.

  const routes = createRoutes({ page })
  const validDeviceId = 'GrfaVyHkxnTf4cxsyIEjkWyNdK0wUoDK153r2LIBoFocvw73T';

  routes.accounts.get
    .withQueryParams({ identifier: 'newaad', password: 'Newaad1!' })
    .respondsWith(200, {
      token: 'valid-token',

      account: {
        identifier: 'customer@email.com',
        location: 'Brooklyn, NY',
        name: 'Customer One',
        photo: 'https://members.cg4.us/customer-one.png'
      }
    })

  routes.accounts.get
    .withQueryParams({ token: 'valid-token' })
    .respondsWith(200, {
      token: 'valid-token',

      account: {
        identifier: 'customer@email.com',
        location: 'Brooklyn, NY',
        name: 'Customer One',
        photo: 'https://members.cg4.us/customer-one.png'
      }
    })

  routes.businesses.get
    .withQueryParams({ identifier: 'customer@email.com' })
    .respondsWith(200, {
      businesses: [
        { name: 'Business 1' }
      ]
    })

  // --------------------------------------------

  const charge = createChargeScreen(page)
  const linkAccount = createLinkAccountScreen(page)
  const root = createRootScreen(page)
  const scan = createScanScreen(page)
  const signIn = createSignInScreen(page)

  // --------------------------------------------

  await signIn.visit()
  await signIn.with({ identifier: 'customer@email.com', password: 'valid' })
  await linkAccount.element('scanButton').click()
  await expect(scan.root()).toBeVisible()

  // --------------------------------------------
  // Check that the network status banner displays properly
  // when offline.

  await expect(root.element('networkStatus')).not.toBeVisible()

  await root.loseConnection()
  await expect(root.element('networkStatus')).toBeVisible()
  await expect(root.element('networkStatus')).toContainText('offline')

  await root.restoreConnection()
  await expect(root.element('networkStatus')).toBeVisible()
  await expect(root.element('networkStatus')).toContainText('online')

  // --------------------------------------------

  // Simulate successful scan by redirecting.
  await charge.visit()
  await expect(charge.root()).toBeVisible()

  await expect(charge.element('businessName')).toHaveText('Business 1')
  await expect(charge.element('profile')).toContainText('Customer One')
  await expect(charge.element('profile')).toContainText('Brooklyn, NY')

  await expect(charge.element('profilePhoto'))
    .toHaveAttribute('src', 'https://members.cg4.us/customer-one.png')
})

test('I cannot scan a valid customer QR code without being signed in.', async ({ page }) => {
  const scan = createScanScreen(page)
  const signIn = createSignInScreen(page)

  await scan.visit()
  await expect(scan.root()).not.toBeVisible()
  await expect(signIn.root()).toBeVisible()
})
