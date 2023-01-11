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
  const pay = createChargeScreen(page)
  const root = createRootScreen(page)
  const signIn = createSignInScreen(page)

  // --------------------------------------------
  // When not signed in, I see the sign-in screen.

  await pay.visit()
  await expect(signIn.root()).toBeVisible()

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
  // When I submit invalid credentials, I see an error message.

  await signIn.with({ identifier: 'invalid@email.com', password: 'invalid' })
  await expect(signIn.element('errorMessage')).toContainText(`couldn't find`)

  // --------------------------------------------
  // When I submit valid credentials, I am directed to the next step.

  await signIn.with({ identifier: 'newaad', password: 'Newaad1!' })
  await expect(signIn.root()).not.toBeVisible()
  await expect(linkAccount.root()).toBeVisible()

  // --------------------------------------------
  // I stay signed in with a valid token.

  await pay.visit()
  await expect(signIn.root()).not.toBeVisible()
  await expect(linkAccount.root()).toBeVisible()

  // --------------------------------------------
  // I am signed out with an invalid token.

  // Set up invalid token context:
  // - Change the token in local storage to an invalid token.
  const storageState = await context.storageState()
  const invalidTokenState = { ...storageState }

  invalidTokenState.origins[0].localStorage
    .find(item => item.name = 'cg.pay.account')
    .value = JSON.stringify({ account: { token: 'invalid-token' } })

  const invalidTokenPage = await browser.newPage({
    storageState: invalidTokenState
  })

  // - Mock the API request to respond to the invalid token.
  const invalidTokenRoutes = createRoutes({ page: invalidTokenPage })

  invalidTokenRoutes.accounts.get
    .withQueryParams({ token: 'invalid-token' })
    .respondsWith(404)

  const payInvalidToken = createChargeScreen(invalidTokenPage)
  const signInInvalidToken = createSignInScreen(invalidTokenPage)

  // - Confirm that I am signed out.
  await payInvalidToken.visit()
  await expect(payInvalidToken.root()).not.toBeVisible()
  await expect(signInInvalidToken.root()).toBeVisible()
})
