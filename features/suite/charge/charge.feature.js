import { test, expect } from '@playwright/test'

import createLinkAccountScreen from '../link-account/link-account.screen.js'
import createRootScreen from '../root.screen.js'
import createRoutes from '../routes.js'
import createScanScreen from '../scan/scan.screen.js'
import createSignInScreen from '../sign-in/sign-in.screen.js'

import createChargeScreen from './charge.screen.js'

// --------------------------------------------
// As a vendor, I can charge an identified customer
// by entering an amount and description, so that I
// can collect payment.

test.skip('I can charge an identified customer.', async ({ page }) => {
  // --------------------------------------------
  // Set up mock API endpoints.

  const routes = createRoutes({ page })

  routes.accounts.get
    .withQueryParams({ identifier: 'customer@email.com', password: 'valid' })
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

  routes.charges.post
    .respondsWith(200)

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

  await charge.visit()
  await expect(charge.root()).toBeVisible()

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
  // Confirm charge goes through when online.

  await charge.with({
    amount: '10.00',
    description: 'Item 1'
  })

  await expect(charge.root()).toContainText('Success')
  await expect(charge.element('profile')).toContainText('Customer One')
  await expect(charge.element('profile')).toContainText('Brooklyn, NY')
  await expect(charge.element('transactionDetails')).toContainText('10')
  await expect(charge.element('transactionDetails')).toContainText('Item 1')

  let chargeRequests = routes.record.calls
    .filter(call => call[0].url.includes('charges'))
    .flat()

  expect(chargeRequests).toHaveLength(1)

  // --------------------------------------------
  // Confirm charges are queued when offline.

  await charge.visit()

  await root.loseConnection()
  await expect(root.element('networkStatus')).toBeVisible()
  await expect(root.element('networkStatus')).toContainText('offline')

  await charge.with({
    amount: '13.00',
    description: 'Item 2'
  })

  await expect(charge.root()).toContainText('Success')
  await expect(charge.element('transactionDetails')).toContainText('13')
  await expect(charge.element('transactionDetails')).toContainText('Item 2')

  chargeRequests = routes.record.calls
    .filter(call => call[0].url.includes('charges'))
    .flat()

  expect(chargeRequests).toHaveLength(1)
  expect(chargeRequests[0].body.description).toEqual('Item 1')

  // --------------------------------------------
  // Confirm charges are sent when back online.

  await root.restoreConnection()
  await page.waitForTimeout(1000)

  chargeRequests = routes.record.calls
    .filter(call => call[0].url.includes('charges'))
    .flat()

  expect(chargeRequests).toHaveLength(2)
  expect(chargeRequests[1].body.description).toEqual('Item 2')

  // --------------------------------------------
  // Ensure Scan Again button redirects properly.

  await charge.scanAgain()
  await expect(charge.root()).not.toBeVisible()
  await expect(scan.root()).toBeVisible()
})

test('I cannot charge an identified customer without being signed in.', async ({ page }) => {
  const charge = createChargeScreen(page)
  const signIn = createSignInScreen(page)

  await charge.visit()
  await expect(charge.root()).not.toBeVisible()
  await expect(signIn.root()).toBeVisible()
})
