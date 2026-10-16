import { expect } from '@playwright/test'
import { Given, Then } from './fixtures'
import { acct } from '../support/accounts'

// "nobody" means nobody is signed in. As the first step of a scenario this also runs the app.
Given('signed in as {string}', async ({ page }, who: string) => {
  if (page.url() === 'about:blank') await page.goto('/')
  const hi = page.getByText(/^Hi, /)
  if (who === 'nobody') await expect(hi).toHaveCount(0)
  else await expect(hi).toHaveText(`Hi, ${acct(who).fullName}`, { timeout: 15_000 })
})
