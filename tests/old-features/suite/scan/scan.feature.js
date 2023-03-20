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
  const validDeviceId = 'GrfaVyHkxnTf4cxsyIEjkWyNdK0wUoDK153r2LIBoFocvw73T'
  const susan = 'G6VM0RZzhWMCq0zcBowqw' // Susan Shopper QR

  routes.identity.get
    .withQueryParams({ deviceId: validDeviceId, otherId: susan })
    .respondsWith(200, {
      name: 'Susan Shopper',
      agent: '',
      location: 'Demoville, MA',
    })

  routes.idPhoto.get
    .withQueryParams({ 
      deviceID: validDeviceId, 
      accountId: 'G6VM01', 
      code: 'GrfaVyHkxnTf4cxsyIEjkWyNdK0wUoDK153r2LIBoFocvw73T4wrVS6LS1m2B2cCwpwcMN3fMJRTKp9Xc_zFra4bMDk5_Z3M1rXYAT6DAeR5cHLikO1g-nnmyRUzt_yGwweGFU4tnKJihNaqRTZSe9CHrltl5VvgsyV_wOOInzsjE_jqCkyMcPieTdFBwf3MNr5_DvtUeiEwNX4CHhviL5atGbaQb-xkdRGy-3z8-_isGoM8fCV6D8y7Ya5npmIvydfnMo1jKYPfvmZKKuYhijqgpJKErlUOcmYzsu6Q7SekpgTGhyZODoPRK_DtHA7bUwDUiN6v1dfOqt_08DUxfg'
    })
    .respondsWith(200, {

    })

  // --------------------------------------------

  const charge = createChargeScreen(page)
  const linkAccount = createLinkAccountScreen(page)
  const root = createRootScreen(page)
  const scan = createScanScreen(page)
  const signIn = createSignInScreen(page)

  // --------------------------------------------

  await signIn.visit()
  await signIn.with({ identifier: 'newaad', password: 'Newaad1!' })
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
