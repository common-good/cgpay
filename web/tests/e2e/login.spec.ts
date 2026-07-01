import { test, expect } from '@playwright/test'

// Smoke tests for the login page. These don't require the DB, JWT_SECRET, or
// the PHP SSO backend — they exercise the frontend contract only. Add a full
// round-trip test in dashboard.spec.ts (which does need env config).

test.describe('login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('renders the sign-in form with the multi-format Account ID field', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()

    // The label was renamed from "Username" to "Account ID" for multi-format signin
    // (William punch list #2).
    const accountId = page.getByLabel(/account id/i)
    await expect(accountId).toBeVisible()

    // The placeholder tells users which formats are accepted.
    await expect(accountId).toHaveAttribute(
      'placeholder',
      /account code, name, email, or phone/i
    )
  })

  test('the password field is present and masked', async ({ page }) => {
    const password = page.getByLabel(/password/i)
    await expect(password).toBeVisible()
    await expect(password).toHaveAttribute('type', 'password')
  })

  test('does not submit when required fields are empty', async ({ page }) => {
    const submit = page.getByRole('button', { name: /sign in/i })
    await submit.click()

    // Still on the login page — no navigation occurred
    await expect(page).toHaveURL(/\/login$/)
  })

  test('shows an error for invalid credentials', async ({ page }) => {
    await page.getByLabel(/account id/i).fill('nobody-that-exists')
    await page.getByLabel(/password/i).fill('wrong-password-xyz')
    await page.getByRole('button', { name: /sign in/i }).click()

    // The exact message can vary between "Invalid account ID or password" and
    // network-error paths; match either.
    const errorPattern = /invalid|failed|error|unable/i
    await expect(page.locator('.error, [role="alert"]').first()).toContainText(
      errorPattern,
      { timeout: 10_000 }
    )

    // Still on the login page — no redirect to /
    await expect(page).toHaveURL(/\/login$/)
  })
})

test.describe('protected route', () => {
  test('the dashboard redirects unauthenticated visitors to /login', async ({ page }) => {
    await page.goto('/')
    // The dashboard's onMount checks localStorage for cg_token and routes to
    // /login when missing. Give the client a moment to run.
    await expect(page).toHaveURL(/\/login$/, { timeout: 5_000 })
  })
})
