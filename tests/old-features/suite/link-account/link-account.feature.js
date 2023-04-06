import { test, expect } from '@playwright/test'

import createRootScreen from '../root.screen.js'
import createRoutes from '../routes.js'
import createSignInScreen from '../sign-in/sign-in.screen.js'

import createLinkAccountScreen from './link-account.screen.js'

// --------------------------------------------
// As a signed-in vendor,
// I can link my CGPay app to a chosen account,
// so that I can charge customers.

test('When I have only one account, my account is automatically linked.', async ({ page }) => {
  // --------------------------------------------
  // Set up mock API endpoints.

  // --------------------------------------------

  const linkAccount = createLinkAccountScreen(page)
  const root = createRootScreen(page)
  const signIn = createSignInScreen(page)

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

  await expect(linkAccount.root()).toContainText('Business 1')
  await expect(linkAccount.root()).toContainText('automatically linked')

})

test('When I have multiple accounts, I can select an account to link.', async ({ page }) => {
  // --------------------------------------------
  // Set up mock API endpoints.

  const routes = createRoutes({ page })

  routes.accounts.get
    .withQueryParams({ identifier: 'newaad', password: 'Newadd1!' })
    .respondsWith(200, {
      accounts: [
        {
          "accountId": "G6VM03",
          "deviceId": "UVgYXbc4z1WLynrZq4DPBjPQkLJajD72g2baYM3LvLxfY1qlwDxv_jyJTi058xNao5KxhWOiyn5VUhAq1QEe1i4C3h8EascRdKGT2zmI5aXHsSg8M9inbHTjWl7ijYh-b1FFUym7ELaBhhHpGeVNRM73UXRAiZRz9JgZIzJbxp_zbx_5Gm1Nd3u7A98ct2X8BWbXa8VLqv3rtQO2m_Q4ntyGID1ysjwxYWgxzyMFLTFQgVPUbLYbYyNvI9AZkmJC4f4FSTZlnplk6x08l8zAy9zAD_I7ehqKg5rYCaipNB7MaCFTQE6bTbPtV0pDN8CIsbcf9pMgbWkk8Q1GShgjoQ",
          "name": "Cathy Cashier"
        },
        {
          "accountId": "G6VM01",
          "deviceId": "Lmaj_r4G0YyilrL345J6JlBIbe1HEB3Hu6Q6bsrriw5L4aJX1jLRVFguOUWwNzD-Dl8Tf7aEt0zutdiVjDhNyR_nwcEAvjOIC6UofNhewRf6JLqd9LH9ipe4xl8XFU7DqYumLyFHKbgSQ8MKlYm-gkTp_WmLRTdYHs3T-rKu049WSWLlxASv_-PpmT5n-W0wWvcjNWhdueLr2lrwbwS2qZ1Ma3F_0Lr53nMb2p07cOxE6Q7NI-RAbVoNpnKTqoxeCNOazL4ZCSK0cnyRQawclDTbqO9dLd_x027kvVKlwyOpdj1yyqv16mjWeIJqiTVrWRuXQZzoC1r-0rM8TXUMtg",
          "name": "Corner Store"
        },
        {
          "accountId": "G7TO00",
          "deviceId": "aY3AUZ4vHBLkkPwdRKzCqFoEhUy65wJjevHLQOhGcwayCDJBofMeXUhWW5pcEt8BgxdxtLNHSHYtgIhIA_K-9bN3v7CUiC9thaFywlGlCGP6hG4w2DER9D8vepNl4FgdXT6xGkBiGNeKMPUtm7AnutCwcPgvfFQChztQkKOVOzEgRusP2ewJmrRgNMc_9gj5Lv-yYR4YPGxTuTt6-2YwAkf0VxZ3uVUmhbj7qSxV0zAjCZ9XtGHKTW5_zh3fhJ2MztZp56JH40FOmbtOnzbyzEWVPSjU8hIwrmNIslgShMniIXI8_Sf0Fn0JBPzE4Fpfh_bD6xJZFRB3fvAWzAsdBA",
          "name": "Octopus Woodworking Academy"
        }
      ]
    })

  // --------------------------------------------

  const linkAccount = createLinkAccountScreen(page)
  const signIn = createSignInScreen(page)

  // Sign in with valid credentials.
  await signIn.visit()
  await signIn.with({ identifier: 'multiple.biz@email.com', password: 'valid' })

  await expect(linkAccount.root()).toBeVisible()
  await expect(linkAccount.root()).not.toContainText('linked')
  await expect(linkAccount.element('businessSelector')).toBeVisible()
  expect(await linkAccount.element('businessOptions').count()).toEqual(3)

  await linkAccount.chooseBusiness('Business 3')
  await expect(linkAccount.element('businessSelector')).not.toBeVisible()
  await expect(linkAccount.root()).toContainText('Business 3')
  await expect(linkAccount.root()).toContainText('successfully linked')
})

test('I cannot link an account without being signed in.', async ({ page }) => {
  const linkAccount = createLinkAccountScreen(page)
  const signIn = createSignInScreen(page)

  await linkAccount.visit()
  await expect(linkAccount.root()).not.toBeVisible()
  await expect(signIn.root()).toBeVisible()
})
