import { expect } from '@playwright/test'
import { When, Then } from './fixtures'

// Page names used in features, mapped to the URL path they live at.
const pages: Record<string, string> = { login: '/login', dashboard: '/', 'new grant': '/grants/new', grants: '/grants' }

function pagePath(name: string): string {
  const path = pages[name]
  if (path === undefined) throw new Error(`Unknown page "${name}". Known: ${Object.keys(pages).join(', ')}`)
  return path
}

// Elements are named by their data-testid.
When('I input {string} as {string}', async ({ page }, value: string, id: string) => { await page.getByTestId(id).fill(value) })

When('I click {string}', async ({ page }, id: string) => { await page.getByTestId(id).click() })

// A page on the PHP member site, by its path below PUBLIC_PHP_BASE_URL.
Then('(I am )on PHP page {string}', async ({ page }, path: string) => { await expect(page).toHaveURL(new RegExp(`/cgmembers/${path}$`), { timeout: 15_000 }) })

When('I select {string} as {string}', async ({ page }, label: string, id: string) => { await page.getByTestId(id).selectOption({ label }) })

When('I go to page {string}', async ({ page }, name: string) => { await page.goto(pagePath(name)) })

Then('I see {string}', async ({ page }, id: string) => { await expect(page.getByTestId(id)).toBeVisible() })

Then('I see text {string}', async ({ page }, text: string) => { await expect(page.getByText(text).first()).toBeVisible() })

Then('I do not see {string}', async ({ page }, id: string) => { await expect(page.getByTestId(id)).toHaveCount(0) })

Then('I see error {string}', async ({ page }, message: string) => {
  await expect(page.getByRole('alert')).toContainText(message, { timeout: 10_000 })
})

Then('(I am )on page {string}', async ({ page }, name: string) => {
  await expect(page).toHaveURL(new RegExp(`^[^/]+//[^/]+${pagePath(name)}$`), { timeout: 15_000 })
})

When('I set camera availability to {string}', async ({ page }, availability: string) => {
  if (availability !== 'present' && availability !== 'absent') {
    throw new Error(`Unknown camera availability "${availability}".`)
  }
  await page.addInitScript((hasCamera: boolean) => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        enumerateDevices: async () => hasCamera ? [{ kind: 'videoinput' }] : []
      }
    })
  }, availability === 'present')
  await page.reload()
})

Then('the Pay and Charge actions use the legacy handoff', async ({ page }) => {
  await expect(page.locator('.actions .action-btn').nth(0)).toHaveAttribute(
    'href',
    'http://localhost:3000/handoff#intent=pay'
  )
  await expect(page.locator('.actions .action-btn').nth(1)).toHaveAttribute(
    'href',
    'http://localhost:3000/handoff#intent=charge'
  )
})

Then('the Pay and Charge actions keep their PHP links', async ({ page }) => {
  await expect(page.locator('.actions .action-btn').nth(0)).toHaveAttribute('href', /tx\/pay$/)
  await expect(page.locator('.actions .action-btn').nth(1)).toHaveAttribute('href', /tx\/charge$/)
})
