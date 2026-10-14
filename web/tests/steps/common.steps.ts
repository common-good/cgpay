import { expect } from '@playwright/test'
import { When, Then } from './fixtures'

// Page names used in features, mapped to the URL path they live at.
const pages: Record<string, string> = { login: '/login', dashboard: '/' }

function pagePath(name: string): string {
  const path = pages[name]
  if (path === undefined) throw new Error(`Unknown page "${name}". Known: ${Object.keys(pages).join(', ')}`)
  return path
}

// Elements are named by their data-testid.
When('I input {string} as {string}', async ({ page }, value: string, id: string) => { await page.getByTestId(id).fill(value) })

When('I click {string}', async ({ page }, id: string) => { await page.getByTestId(id).click() })

Then('I see {string}', async ({ page }, id: string) => { await expect(page.getByTestId(id)).toBeVisible() })

Then('I see error {string}', async ({ page }, message: string) => {
  await expect(page.getByRole('alert')).toContainText(message, { timeout: 10_000 })
})

Then('(I am )on page {string}', async ({ page }, name: string) => {
  await expect(page).toHaveURL(new RegExp(`^[^/]+//[^/]+${pagePath(name)}$`), { timeout: 15_000 })
})
