import { test, expect } from '@playwright/test'

// Smoke tests for the Expected Grants pages. These don't require the DB or the
// PHP /cgpay-grants backend — they exercise the frontend contract only:
// unauthenticated visitors are bounced to /login, the form structure is
// correct, and the client-side validation prevents empty submits.

test.describe('grants list — protected route', () => {
  test('/grants redirects unauthenticated visitors to /login', async ({ page }) => {
    await page.goto('/grants')
    await expect(page).toHaveURL(/\/login$/, { timeout: 5_000 })
  })

  test('/grants/new redirects unauthenticated visitors to /login', async ({ page }) => {
    await page.goto('/grants/new')
    await expect(page).toHaveURL(/\/login$/, { timeout: 5_000 })
  })
})

test.describe('grants create form — client contract', () => {
  // Uses the E2E escape hatch in `grants/+layout.server.ts` (E2E_FAKE_USER=1 env
  // + `e2e-fake-user=sponsee` cookie) so we can render the form UI without a
  // live PHP whoami backend. Form submissions still hit `/api/grants` for real
  // and get a 401 (no PHP session) - the submit test relies on that.
  test.beforeEach(async ({ context, page }) => {
    await context.addCookies([{
      name: 'e2e-fake-user',
      value: 'sponsee',
      url: 'http://127.0.0.1:4173'
    }])
    await page.goto('/grants/new')
  })

  test('renders the required fields (grantor + amount + method)', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /report expected grant/i })).toBeVisible()
    await expect(page.getByLabel(/grantor name/i)).toBeVisible()
    await expect(page.getByLabel(/expected amount/i)).toBeVisible()
    await expect(page.getByLabel(/payment method/i)).toBeVisible()
  })

  test('the submit button stays disabled until required fields are filled', async ({ page }) => {
    const submit = page.getByRole('button', { name: /report grant/i })
    await expect(submit).toBeDisabled()

    await page.getByLabel(/grantor name/i).fill('Ada Lovelace Foundation')
    await expect(submit).toBeDisabled() // amount + address still missing

    await page.getByLabel(/expected amount/i).fill('1500.00')
    await expect(submit).toBeDisabled() // address fields still missing (William 2026-07-31)

    await page.getByLabel(/street address/i).fill('123 Main St')
    await page.getByLabel(/city/i).fill('Ashfield')
    await page.getByLabel(/^state/i).fill('26')
    await page.getByLabel(/zip/i).fill('01330')
    await expect(submit).toBeEnabled()
  })

  test('submitting with an invalid token surfaces an error and stays on /grants/new', async ({ page }) => {
    await page.getByLabel(/grantor name/i).fill('Ada Lovelace Foundation')
    await page.getByLabel(/expected amount/i).fill('1500')
    await page.getByLabel(/street address/i).fill('123 Main St')
    await page.getByLabel(/city/i).fill('Ashfield')
    await page.getByLabel(/^state/i).fill('26')
    await page.getByLabel(/zip/i).fill('01330')
    await page.getByRole('button', { name: /report grant/i }).click()

    // With a bogus token, /api/grants returns 401 → client wipes token and
    // redirects to /login. Either the alert appears (network path) or we land
    // on /login — both are correct fail-closed behavior.
    await Promise.race([
      expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5_000 }),
      expect(page).toHaveURL(/\/login$/, { timeout: 5_000 })
    ])
  })
})
