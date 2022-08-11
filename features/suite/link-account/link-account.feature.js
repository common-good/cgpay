import { test, expect } from '@playwright/test'

import appContext from '../../context/context.provider.js'
import createLinkAccountScreen from '../link-account/link-account.screen.js'
import createSignInScreen from '../sign-in/sign-in.screen.js'

// --------------------------------------------
// As a signed-in vendor,
// I can link my CGPay app to a chosen business account,
// so that I can charge customers for my business.

test.only('When I have only one business account, my business is automatically linked.', async ({ page }) => {
  // --------------------------------------------
  // Set up mock API endpoints.

  const accountsRoute = appContext('membersApi.location') + '/accounts'
  const businessesRoute = appContext('membersApi.location') + '/businesses'

  await page.route(accountsRoute + '?identifier=oneaccount%40email.com&password=valid', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',

      body: JSON.stringify({
        account: {
          identifier: 'oneaccount@email.com'
        },

        token: 'valid-token'
      })
    })
  })

  await page.route(businessesRoute + '?identifier=oneaccount%40email.com', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',

      body: JSON.stringify({
        businesses: [
          {
            name: 'Business 1'
          }
        ]
      })
    })
  })

  // --------------------------------------------

  const linkAccount = createLinkAccountScreen(page)
  const signIn = createSignInScreen(page)

  // Sign in with valid credentials.
  await signIn.visit()
  await signIn.with({ identifier: 'oneaccount@email.com', password: 'valid' })

  await expect(linkAccount.element('root')).toBeVisible()
  await expect(linkAccount.element('root')).toContainText('Business 1')
  await expect(linkAccount.element('root')).toBeVisible('automatically linked')
})
