import { expect } from '@playwright/test'
import { Given, When, Then } from './fixtures'
import { acct } from '../support/accounts'

// "nobody" means nobody is signed in. As the first step of a scenario this also runs the app.
Given('signed in as {string}', async ({ page }, who: string) => {
  if (page.url() === 'about:blank') await page.goto('/')
  const hi = page.getByText(/^Hi, /)
  if (who === 'nobody') await expect(hi).toHaveCount(0)
  else await expect(hi).toHaveText(`Hi, ${acct(who).fullName}`, { timeout: 15_000 })
})

// Signs in through the sign-in form, as a person, with the standard password.
Given('I sign in as {string}', async ({ page }, who: string) => {
  await page.goto('/login')
  await page.getByTestId('identifier').fill(acct(who).fullName)
  await page.getByTestId('password').fill(acct(who).password ?? '')
  await page.getByTestId('btn-signin').click()
  await expect(page).toHaveURL(/^[^/]+\/\/[^/]+\/$/, { timeout: 15_000 })
})

// Switches the signed-in person to act as a company (PHP does the switch; node follows via whoami).
When('I act as {string}', async ({ page }, who: string) => {
  const php = (process.env.PUBLIC_PHP_BASE_URL ?? 'http://localhost/cg/cgmembers').replace(/\/+$/, '')
  await page.request.get(`${php}/change-account/acct=${acct(who).identifier}`, { maxRedirects: 0 }) // shares the page's cookies; PHP then redirects to a dashboard we don't need
  await page.goto('/')
})
