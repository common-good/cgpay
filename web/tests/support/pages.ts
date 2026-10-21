import { expect } from '@playwright/test'
import type { App } from '../steps/fixtures'
import { acct } from './accounts'
import { resolve } from './magic'

// What the steps do in the browser. The only place that knows page names, element ids (data-testid) and URLs.
// Checks are named so... and say what they were looking for when they fail.

// Page names used in features, mapped to the URL path they live at.
const pages: Record<string, string> = { login: '/login', dashboard: '/', 'new grant': '/grants/new', grants: '/grants' }

// Where the Pay and Charge buttons lead when the device has a camera (the legacy app, see CGPAY_PWA_URL).
const LEGACY_APP = 'http://localhost:3000'

function pagePath(name: string): string {
  const path = pages[name]
  if (path === undefined) throw new Error(`Unknown page "${name}". Known: ${Object.keys(pages).join(', ')}`)
  return path
}

// An element id (like btn-signin or ckNum) starts with a lowercase letter and has no spaces or punctuation except - and _.
function looksLikeId(s: string): boolean { return /^[a-z][A-Za-z0-9_-]*$/.test(s) }

const text = (app: App, v: unknown, field?: string) => String(resolve(v, field, app))
const hi = (app: App) => app.page.getByText(/^Hi, /)

/** Switch the signed-in person to act as a company (PHP does the switch; node follows via whoami). */
export async function actAs(app: App, who: string) {
  const php = (process.env.PUBLIC_PHP_BASE_URL ?? 'http://localhost/cg/cgmembers').replace(/\/+$/, '')
  await app.page.request.get(`${php}/change-account/acct=${acct(who).identifier}`, { maxRedirects: 0 }) // shares the page's cookies; PHP then redirects to a dashboard we don't need
  await app.page.goto('/')
}

/** Give the device a camera or take it away ("present" or "absent"), then reload so the dashboard notices. */
export async function camera(app: App, state: string) {
  if (state !== 'present' && state !== 'absent') throw new Error(`camera "${state}": say "present" or "absent".`)
  await app.page.addInitScript((hasCamera: boolean) => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { enumerateDevices: async () => hasCamera ? [{ kind: 'videoinput' }] : [] }
    })
  }, state === 'present')
  await app.page.reload()
}

export async function click(app: App, id: string) { await app.page.getByTestId(id).click() }

export async function input(app: App, id: string, value: unknown) { await app.page.getByTestId(id).fill(text(app, value, id)) }

export async function onPage(app: App, name: string) { await app.page.goto(pagePath(name)) }

export async function select(app: App, id: string, label: string) { await app.page.getByTestId(id).selectOption({ label: text(app, label, id) }) }

/**
 * Make sure this person is signed in: run the app (for "nobody") or sign in through the form, with the standard password.
 * Fails if somebody else is already signed in.
 */
export async function signedIn(app: App, who: string) {
  const { page } = app
  if (page.url() === 'about:blank') await page.goto('/')
  if (who === 'nobody') return await expect(hi(app), `signed in as "nobody"`).toHaveCount(0)
  if (await hi(app).count()) return await soSignedIn(app, who)
  await page.goto('/login')
  await page.getByTestId('identifier').fill(acct(who).fullName)
  await page.getByTestId('password').fill(acct(who).password ?? '')
  await page.getByTestId('btn-signin').click()
  await expect(page, `signed in as "${who}" (the dashboard)`).toHaveURL(/^[^/]+\/\/[^/]+\/$/, { timeout: 15_000 })
}

export async function soError(app: App, message: string) {
  await expect(app.page.getByRole('alert'), `error "${message}"`).toContainText(message, { timeout: 10_000 })
}

export async function soOnPage(app: App, name: string) {
  await expect(app.page, `on page "${name}"`).toHaveURL(new RegExp(`^[^/]+//[^/]+${pagePath(name)}$`), { timeout: 15_000 })
}

// A page on the PHP member site, by its path below PUBLIC_PHP_BASE_URL.
export async function soOnPhpPage(app: App, path: string) {
  await expect(app.page, `on PHP page "${path}"`).toHaveURL(new RegExp(`/cgmembers/${path}$`), { timeout: 15_000 })
}

/** The Pay and Charge buttons lead to the legacy app ("legacy app") or to the PHP pages ("PHP"). */
export async function soPayAndChargeGoTo(app: App, where: string) {
  const link = (n: number) => app.page.locator('.actions .action-btn').nth(n)
  const at = `pay and charge go to "${where}"`
  if (where === 'legacy app') {
    await expect(link(0), at).toHaveAttribute('href', `${LEGACY_APP}/handoff#intent=pay`)
    await expect(link(1), at).toHaveAttribute('href', `${LEGACY_APP}/handoff#intent=charge`)
  } else if (where === 'PHP') {
    await expect(link(0), at).toHaveAttribute('href', /tx\/pay$/)
    await expect(link(1), at).toHaveAttribute('href', /tx\/charge$/)
  } else throw new Error(`${at}: say "legacy app" or "PHP".`)
}

/** Something is visible: an element if the text looks like an element id, otherwise literal text. */
export async function soSee(app: App, what: string) {
  const v = text(app, what)
  if (looksLikeId(v)) await expect(app.page.getByTestId(v), `see "${v}" (as an element id)`).toBeVisible()
  else await expect(app.page.getByText(v).first(), `see "${v}" (as text)`).toBeVisible()
}

/** Something is not there: an element if the text looks like an element id, otherwise literal text. */
export async function soSeeNot(app: App, what: string) {
  const v = text(app, what)
  if (looksLikeId(v)) await expect(app.page.getByTestId(v), `see not "${v}" (as an element id)`).toHaveCount(0)
  else await expect(app.page.getByText(v), `see not "${v}" (as text)`).toHaveCount(0)
}

export async function soSignedIn(app: App, who: string) {
  if (who === 'nobody') return await expect(hi(app), `signed in as "nobody"`).toHaveCount(0)
  await expect(hi(app), `signed in as "${who}"`).toHaveText(`Hi, ${acct(who).fullName}`, { timeout: 15_000 })
}
