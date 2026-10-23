import { expect } from '@playwright/test'
import type { App } from '../steps/fixtures'
import { acct } from './accounts'
import { resolve } from './magic'

// What the steps do in the browser. The only place that knows element ids (data-testid) and URLs.
// Checks are named so... and say what they were looking for when they fail.

// Where the Pay and Charge buttons lead when the device has a camera (the legacy app, see CGPAY_PWA_URL).
const LEGACY_APP = 'http://localhost:3000'

// An element id (like btn-signin or ckNum) starts with a lowercase letter and has no spaces or punctuation except - and _.
const looksLikeId = (s: string) => /^[a-z][A-Za-z0-9_-]*$/.test(s)

const text = (app: App, v: unknown, field?: string) => String(resolve(v, field, app))
const hi = (app: App) => app.page.getByText(/^Hi, /)
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Put a value in the element with this id: choose it if the element is a select, otherwise type it.
async function setField(app: App, id: string, value: unknown) {
  const el = app.page.getByTestId(id)
  const v = text(app, value, id)
  if (await el.evaluate(e => e.tagName) === 'SELECT') await el.selectOption({ label: v })
  else await el.fill(v)
}

async function checkSignedIn(app: App, who: string) {
  if (who === 'nobody') return await expect(hi(app), `signed in as "nobody"`).toHaveCount(0)
  await expect(hi(app), `signed in as "${who}"`).toHaveText(`Hi, ${acct(who).fullName}`, { timeout: 15_000 })
}

export default {
  /** Switch the signed-in person to act as a company (PHP does the switch; node follows via whoami). */
  async actingAs(app: App, who: string) {
    const php = (process.env.PUBLIC_PHP_BASE_URL ?? 'http://localhost/cg/cgmembers').replace(/\/+$/, '')
    await app.page.request.get(`${php}/change-account/acct=${acct(who).identifier}`, { maxRedirects: 0 }) // shares the page's cookies; PHP then redirects to a dashboard we don't need
    await app.page.goto('/')
  },

  /** Give the device a camera or take it away ("present" or "absent"), then reload so the dashboard notices. */
  async camera(app: App, state: string) {
    if (state !== 'present' && state !== 'absent') throw new Error(`camera "${state}": say "present" or "absent".`)
    await app.page.addInitScript((hasCamera: boolean) => {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: { enumerateDevices: async () => hasCamera ? [{ kind: 'videoinput' }] : [] }
      })
    }, state === 'present')
    await app.page.reload()
  },

  async click(app: App, id: string) { await app.page.getByTestId(id).click() },

  async input(app: App, id: string, value: unknown) { await setField(app, id, value) },

  /** Fill in several elements: a table with the element ids in the header row and the values in the one row below. Selects work too. */
  async inputRow(app: App, table: { raw(): string[][] }) {
    const [ids, values, ...extra] = table.raw()
    if (!values || extra.length) throw new Error('input: needs a header row with the element ids and exactly one row of values below it.')
    for (const [i, id] of ids.entries()) await setField(app, id, values[i])
  },

  async onPage(app: App, path: string) { await app.page.goto('/' + path) },

  async select(app: App, id: string, label: string) { await setField(app, id, label) },

  /**
   * Make sure this person is signed in: run the app (for "nobody") or sign in through the form, with the standard password.
   * Fails if somebody else is already signed in.
   */
  async signedIn(app: App, who: string) {
    const { page } = app
    if (page.url() === 'about:blank') await page.goto('/')
    if (who === 'nobody' || await hi(app).count()) return await checkSignedIn(app, who)
    await page.goto('/login')
    await page.getByTestId('identifier').fill(acct(who).fullName)
    await page.getByTestId('password').fill(acct(who).password ?? '')
    await page.getByTestId('btn-signin').click()
    await expect(page, `signed in as "${who}" (the dashboard)`).toHaveURL(/^[^/]+\/\/[^/]+\/$/, { timeout: 15_000 })
  },

  async soError(app: App, message: string) {
    await expect(app.page.getByRole('alert'), `error "${message}"`).toContainText(message, { timeout: 10_000 })
  },

  async soOnPage(app: App, path: string) {
    await expect(app.page, `on page "${path}"`).toHaveURL(new RegExp(`^[^/]+//[^/]+/${escapeRegExp(path)}$`), { timeout: 15_000 })
  },

  // A page on the PHP member site, by its path below PUBLIC_PHP_BASE_URL.
  async soOnPhpPage(app: App, path: string) {
    await expect(app.page, `on PHP page "${path}"`).toHaveURL(new RegExp(`/cgmembers/${escapeRegExp(path)}$`), { timeout: 15_000 })
  },

  /** The Pay and Charge buttons lead to the legacy app ("legacy app") or to the PHP pages ("PHP"). */
  async soPayAndChargeGoTo(app: App, where: string) {
    const link = (n: number) => app.page.locator('.actions .action-btn').nth(n)
    const at = `pay and charge go to "${where}"`
    if (where === 'legacy app') {
      await expect(link(0), at).toHaveAttribute('href', `${LEGACY_APP}/handoff#intent=pay`)
      await expect(link(1), at).toHaveAttribute('href', `${LEGACY_APP}/handoff#intent=charge`)
    } else if (where === 'PHP') {
      await expect(link(0), at).toHaveAttribute('href', /tx\/pay$/)
      await expect(link(1), at).toHaveAttribute('href', /tx\/charge$/)
    } else throw new Error(`${at}: say "legacy app" or "PHP".`)
  },

  /** Something is visible: an element if the text looks like an element id, otherwise literal text. */
  async soSee(app: App, what: string) {
    const v = text(app, what)
    if (looksLikeId(v)) await expect(app.page.getByTestId(v), `see "${v}" (as an element id)`).toBeVisible()
    else await expect(app.page.getByText(v).first(), `see "${v}" (as text)`).toBeVisible()
  },

  /** Something is not there: an element if the text looks like an element id, otherwise literal text. */
  async soSeeNot(app: App, what: string) {
    const v = text(app, what)
    if (looksLikeId(v)) await expect(app.page.getByTestId(v), `see not "${v}" (as an element id)`).toHaveCount(0)
    else await expect(app.page.getByText(v), `see not "${v}" (as text)`).toHaveCount(0)
  },

  async soSignedIn(app: App, who: string) { await checkSignedIn(app, who) }
}
