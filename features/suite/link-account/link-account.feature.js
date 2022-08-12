import { test, expect } from '@playwright/test'

import createLinkAccountScreen from '../link-account/link-account.screen.js'
import createRoutes from '../routes.js'
import createSignInScreen from '../sign-in/sign-in.screen.js'

// --------------------------------------------
// As a signed-in vendor,
// I can link my CGPay app to a chosen business account,
// so that I can charge customers for my business.

test('When I have only one business account, my business is automatically linked.', async ({ page }) => {
  // --------------------------------------------
  // Set up mock API endpoints.

  const routes = createRoutes({ page })

  routes.accounts.get
    .withQueryParams({ identifier: 'one.biz@email.com', password: 'valid' })
    .respondsWith(200, {
      token: 'token',

      account: {
        identifier: 'one.biz@email.com'
      }
    })

  routes.businesses.get
    .withQueryParams({ identifier: 'one.biz@email.com' })
    .respondsWith(200, {
      businesses: [
        { name: 'Business 1' }
      ]
    })

  // --------------------------------------------

  const linkAccount = createLinkAccountScreen(page)
  const signIn = createSignInScreen(page)

  // Sign in with valid credentials.
  await signIn.visit()
  await signIn.with({ identifier: 'one.biz@email.com', password: 'valid' })

  await expect(linkAccount.element('root')).toBeVisible()
  await expect(linkAccount.element('root')).toContainText('Business 1')
  await expect(linkAccount.element('root')).toContainText('automatically linked')
})

test('When I have multiple business accounts, I can select a business to link.', async ({ page }) => {
  // --------------------------------------------
  // Set up mock API endpoints.

  const routes = createRoutes({ page })

  await routes.accounts.get
    .withQueryParams({ identifier: 'multiple.biz@email.com', password: 'valid' })
    .respondsWith(200, {
      account: {
        identifier: 'multiple.biz@email.com'
      },

      token: 'token'
    })

  await routes.businesses.get
    .withQueryParams({ identifier: 'multiple.biz@email.com' })
    .respondsWith(200, {
      businesses: [
        { name: 'Business 1' },
        { name: 'Business 2' },
        { name: 'Business 3' }
      ]
    })

  // --------------------------------------------

  const linkAccount = createLinkAccountScreen(page)
  const signIn = createSignInScreen(page)

  // Sign in with valid credentials.
  await signIn.visit()
  await signIn.with({ identifier: 'multiple.biz@email.com', password: 'valid' })

  await expect(linkAccount.element('root')).toBeVisible()
  await expect(linkAccount.element('root')).not.toContainText('linked')
  await expect(linkAccount.element('businessSelector')).toBeVisible()
  expect(await linkAccount.element('businessOptions').count()).toEqual(3)

  await linkAccount.chooseBusiness('Business 3')
  await expect(linkAccount.element('businessSelector')).not.toBeVisible()
  await expect(linkAccount.element('root')).toContainText('Business 3')
  await expect(linkAccount.element('root')).toContainText('successfully linked')
})
