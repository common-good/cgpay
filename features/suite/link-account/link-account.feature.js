import { test, expect } from '@playwright/test'

import createChargeScreen from '../charge/charge.screen.js'
import createRootScreen from '../root.screen.js'
import createRoutes from '../routes.js'
import createScanScreen from '../scan/scan.screen.js'
import createSignInScreen from '../sign-in/sign-in.screen.js'

import createLinkAccountScreen from './link-account.screen.js'

// --------------------------------------------
// As a signed-in vendor,
// I can link my CGPay app to a chosen account account,
// so that I can charge customers for my account.

test('When I have only one account, my account is automatically linked.', async ({ page }) => {
  // --------------------------------------------
  // Set up mock API endpoints.

  const routes = createRoutes({ page })

  routes.accounts.get
    .withQueryParams({ identifier: 'one.biz@email.com', password: 'valid' })
    .respondsWith(200, {
      accounts: [
        { name: 'Account 1' }
      ]
    })

  routes.accounts.get
    .withQueryParams({ identifier: 'one.biz@email.com' })
    .respondsWith(200, {
      accounts: [
        { name: 'Account 1' },
        { name: 'Account 2' },
        { name: 'Account 3' }
      ]
    })

  // --------------------------------------------

  const charge = createChargeScreen(page)
  const linkAccount = createLinkAccountScreen(page)
  const root = createRootScreen(page)
  const scan = createScanScreen(page)
  const signIn = createSignInScreen(page)

  // --------------------------------------------
  // Sign in with valid credentials.

  await signIn.visit()
  await signIn.with({ identifier: 'one.biz@email.com', password: 'valid' })

  await expect(linkAccount.root()).toBeVisible()

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
  // Check that the only account is automatically
  // linked.

  await expect(linkAccount.root()).toContainText('Account 1')
  await expect(linkAccount.root()).toContainText('automatically linked')

  await linkAccount.proceedToScan()
  await expect(linkAccount.root()).not.toBeVisible()
  await expect(scan.root()).toBeVisible()

  // --------------------------------------------
  // I stay signed in with a linked account.

  await root.visit()
  await expect(signIn.root()).not.toBeVisible()
  await expect(scan.root()).toBeVisible()
  await expect(scan.root()).toContainText('Account 1')
})

test('When I have multiple accounts, I can select a account to link.', async ({ page }) => {
  // --------------------------------------------
  // Set up mock API endpoints.

  const routes = createRoutes({ page })

  await routes.accounts.get
    .withQueryParams({ identifier: 'multiple.biz@email.com', password: 'valid' })
    .respondsWith(200, {
      accounts: [
        { name: 'Account 1' },
        { name: 'Account 2' },
        { name: 'Account 3' }
      ]
    })

  // --------------------------------------------

  const linkAccount = createLinkAccountScreen(page)
  const scan = createScanScreen(page)
  const signIn = createSignInScreen(page)

  // Sign in with valid credentials.
  await signIn.visit()
  await signIn.with({ identifier: 'multiple.biz@email.com', password: 'valid' })

  await expect(linkAccount.root()).toBeVisible()
  await expect(linkAccount.root()).not.toContainText('linked')
  await expect(linkAccount.element('accountSelector')).toBeVisible()
  expect(await linkAccount.element('accountOptions').count()).toEqual(3)

  await linkAccount.chooseAccount('Account 3')
  await expect(linkAccount.element('accountSelector')).not.toBeVisible()
  await expect(linkAccount.root()).toContainText('Account 3')
  await expect(linkAccount.root()).toContainText('successfully linked')
})

test('I cannot link an account without being signed in.', async ({ page }) => {
  const linkAccount = createLinkAccountScreen(page)
  const signIn = createSignInScreen(page)

  await linkAccount.visit()
  await expect(linkAccount.root()).not.toBeVisible()
  await expect(signIn.root()).toBeVisible()
})
