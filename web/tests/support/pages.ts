import { expect, type Route } from '@playwright/test'
import type { App } from '../steps/fixtures'
import { acct } from './accounts'
import { resolve } from './magic'
import { writeCameraVideo } from './camera'
import { qrOf } from './accounts'

// What the steps do in the browser. The only place that knows element ids (data-testid) and URLs.
// Checks are named so... and say what they were looking for when they fail.

// Where the Pay and Charge buttons lead when the device has a camera (the legacy app, see CGPAY_PWA_URL).
const LEGACY_APP = `http://localhost:${process.env.E2E_PWA_PORT ?? '3000'}`
// E2E_SCREENS=bundled runs the transaction features against the store app's bundled screens instead of the legacy app.
const BUNDLED_MODE = process.env.E2E_SCREENS === 'bundled'
// Where the tests serve the store app's bundled screens (PUBLIC_APP_URL in playwright.config.ts).
const BUNDLED = `http://localhost:${process.env.E2E_APP_PORT ?? '5180'}`

// An element id (like btn-signin or ckNum) starts with a lowercase letter and has no spaces or punctuation except - and _.
const looksLikeId = (s: string) => /^[a-z][A-Za-z0-9_-]*$/.test(s)

const text = (app: App, v: unknown, field?: string) => String(resolve(v, field, app))
const hi = (app: App) => app.page.getByText(/^Hi, /)
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// Everything but the store app's own files fails, as with no signal (the app's files come from the phone).
const cutOff = (r: Route) => new URL(r.request().url()).origin === BUNDLED ? r.continue() : r.abort('internetdisconnected')

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

  /**
   * Give the device a camera or take it away ("present" or "absent"). The browser has a fake camera, so "present" only waits
   * until the dashboard has found it (until then Pay and Receive lead to PHP); "absent" hides it, then reload so the dashboard notices.
   */
  async camera(app: App, state: string) {
    if (state !== 'present' && state !== 'absent') throw new Error(`camera "${state}": say "present" or "absent".`)
    if (state === 'present' && BUNDLED_MODE) return await this.inStoreApp(app) // the app's dashboard needs no camera test
    if (state === 'present') return await expect(app.page.getByTestId('btn-pay'), 'camera "present": the dashboard found the camera').toHaveAttribute('href', /\/handoff#intent=/)
    await app.page.addInitScript((hasCamera: boolean) => {
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: { enumerateDevices: async () => hasCamera ? [{ kind: 'videoinput' }] : [] }
      })
    }, false)
    await app.page.reload()
  },

  /** The camera sees this account's QR code (set before the scan page opens). */
  async cameraShows(app: App, who: string) { writeCameraVideo(who === 'nobody' ? '' : qrOf(who)) }, // a white picture, for "nobody"

  /** The page runs inside the store app's WebView, which marks its user agent (see web/app/capacitor.config.ts). */
  async inStoreApp(app: App) {
    await app.page.addInitScript(() => {
      const ua = navigator.userAgent + ' CGPayApp'
      Object.defineProperty(navigator, 'userAgent', { configurable: true, get: () => ua })
    })
    await app.page.reload()
    app.storeApp = true
    if (!app.page.url().includes('/login')) await expect(app.page.getByTestId('nav-app'), 'in the store app: the dashboard got the device credentials').toHaveAttribute('href', /device=/)
  },

  async click(app: App, id: string) { await app.page.getByTestId(id).click() },

  async input(app: App, id: string, value: unknown) { await setField(app, id, value) },

  /** Fill in several elements: a table with the element ids in the header row and the values in the one row below. Selects work too. */
  async inputRow(app: App, table: { raw(): string[][] }) {
    const [ids, values, ...extra] = table.raw()
    if (!values || extra.length) throw new Error('input: needs a header row with the element ids and exactly one row of values below it.')
    for (const [i, id] of ids.entries()) await setField(app, id, values[i])
  },

  /**
   * Cut the connection (or restore it), as on a phone with no signal: every request but the store app's own files fails,
   * so the live site and PHP's API cannot be reached. A scan then starts from the app's own home screen.
   * (The browser's own offline switch is no use: a page loaded while it is on cannot fetch anything after it is off again.)
   */
  async network(app: App, on: boolean) {
    const ctx = app.page.context()
    app.offline = !on
    if (on) {
      await ctx.unroute('**/*', cutOff)
      for (const p of ctx.pages()) await p.evaluate(() => window.dispatchEvent(new Event('online'))) // what the browser does when the network returns
    } else await ctx.route('**/*', cutOff)
  },

  async onPage(app: App, path: string) { await app.page.goto('/' + path) },

  async reload(app: App) { await app.page.reload() },

  /**
   * Scan this account's QR code to pay or charge it ("pay" or "charge"), starting from the dashboard: the camera shows the code,
   * then the dashboard's Pay or Charge button leads to the scanner (through the start page, which companies skip).
   */
  async scan(app: App, who: string, why: string) {
    const btn = { pay: 'btn-pay', charge: 'btn-receive' }[why]
    if (!btn) throw new Error(`scan "${who}" to "${why}": say "pay" or "charge".`)
    writeCameraVideo(qrOf(who))
    if (app.offline) await app.page.goto(BUNDLED + '/'); else await app.page.goto('/')
    if (BUNDLED_MODE || app.storeApp || app.offline) return await this.scanInBundled(app, btn)
    await this.camera(app, 'present')
    await app.page.getByTestId(btn).click()
    await app.page.waitForURL(/\/(tx-start|scan)$/, { timeout: 15_000 })
    if (app.page.url().endsWith('/tx-start')) await app.page.getByTestId('btn-scan').click()
    await app.page.waitForURL(/\/(tx|)$/, { timeout: 15_000 }) // the transaction page, or the dashboard when the scan fails
  },

  // The store app's bundled screens: the dashboard (in the app) opens them, the start page is skipped by companies, and a failed scan returns to the dashboard.
  async scanInBundled(app: App, btn: string) {
    if (!app.offline) {
      if (!app.storeApp) await this.inStoreApp(app)
      await expect(app.page.getByTestId('nav-app'), 'scan: the dashboard got the device credentials').toHaveAttribute('href', /device=/)
    }
    await app.page.getByTestId(btn).click()
    const screen = (name: string) => app.page.locator(`[data-screen="${name}"]`)
    await expect(screen('tx-start').or(screen('scan')).or(screen('tx')), 'scan: the bundled screens opened').toBeVisible({ timeout: 15_000 })
    if (await screen('tx-start').count()) await app.page.getByTestId('btn-scan').click()
    await expect(screen('tx').or(app.page.getByTestId('balance')), 'scan: the transaction screen, or the dashboard when the scan fails').toBeVisible({ timeout: 15_000 })
  },

  async wait(seconds: number) { await new Promise(ok => setTimeout(ok, seconds * 1000)) },

  async select(app: App, id: string, label: string) { await setField(app, id, label) },

  /** From now on PHP's API answers this endpoint with an error page (status 200, not JSON), as when PHP crashes. */
  async serverErrorPage(app: App, endpoint: string) {
    await app.page.context().route(`**/api/${endpoint}`, r => r.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>Fatal error</body></html>' }))
  },

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

  /**
   * Leave a session cookie PHP does not know in the browser, which sends it ahead of the good one on API calls
   * (a longer path goes first). Online it is an older scope of the same name; locally a host has only one scope, so the path stands in.
   */
  async staleSessionCookie(app: App) {
    await app.page.context().addCookies([{ name: process.env.PHP_SSO_COOKIE_NAME as string, value: 'stale', domain: 'localhost', path: '/api', secure: true, httpOnly: true }])
  },

  /** The page's address (hash included) no longer mentions this, for example a parameter the page should have removed. */
  async soAddressHasNo(app: App, part: string) {
    await expect.poll(() => app.page.url(), `address has no "${part}"`).not.toContain(part)
  },

  /** The store app still holds this many transactions the server did not clearly accept (each kept with the reason). */
  async soAppKeepsRefused(app: App, n: number) {
    const count = () => app.page.evaluate(() => new Promise<number>((ok, no) => {
      const db = indexedDB.open('cgpay')
      db.onerror = () => no(db.error)
      db.onsuccess = () => {
        const q = db.result.transaction('kv').objectStore('kv').getAll(IDBKeyRange.bound('tx:', 'tx:\uffff'))
        q.onsuccess = () => ok(q.result.filter((t: { error?: string }) => t.error).length)
      }
    }))
    await expect.poll(count, { message: `the app keeps ${n} refused transactions` }).toBe(n)
  },

  async soError(app: App, message: string) {
    await expect(app.page.getByRole('alert').filter({ hasText: message }).first(), `error "${message}"`).toBeVisible({ timeout: 10_000 })
  },

  async soOnPage(app: App, path: string) {
    if ((BUNDLED_MODE || app.storeApp) && ['home', 'tx-start', 'scan', 'tx'].includes(path)) return await expect(app.page.locator(`[data-screen="${path}"]`), `on page "${path}" (bundled screen)`).toBeVisible({ timeout: 15_000 })
    if (app.storeApp && !path) await expect(app.page, 'on page "" (left the bundled screens)').not.toHaveURL(new RegExp(`^${escapeRegExp(BUNDLED)}`), { timeout: 15_000 })
    await expect(app.page, `on page "${path}"`).toHaveURL(new RegExp(`^[^/]+//[^/]+/${escapeRegExp(path)}$`), { timeout: 15_000 })
  },

  // A page on the PHP member site, by its path below PUBLIC_PHP_BASE_URL.
  async soOnPhpPage(app: App, path: string) {
    await expect(app.page, `on PHP page "${path}"`).toHaveURL(new RegExp(`/cgmembers/${escapeRegExp(path)}$`), { timeout: 15_000 })
  },

  /** The Pay and Charge buttons lead to the legacy app ("legacy app"), the PHP pages ("PHP") or the store app's bundled screens ("bundled screens"). */
  async soPayAndChargeGoTo(app: App, where: string) {
    const link = (n: number) => app.page.locator('.actions .action-btn').nth(n)
    const at = `pay and charge go to "${where}"`
    if (where === 'legacy app') {
      await expect(link(0), at).toHaveAttribute('href', `${LEGACY_APP}/handoff#intent=pay`)
      await expect(link(1), at).toHaveAttribute('href', `${LEGACY_APP}/handoff#intent=charge`)
    } else if (where === 'PHP') {
      await expect(link(0), at).toHaveAttribute('href', /tx\/pay$/)
      await expect(link(1), at).toHaveAttribute('href', /tx\/charge$/)
    } else if (where === 'bundled screens') {
      await expect(link(0), at).toHaveAttribute('href', new RegExp(`^${escapeRegExp(BUNDLED)}/#intent=pay&device=`))
      await expect(link(1), at).toHaveAttribute('href', new RegExp(`^${escapeRegExp(BUNDLED)}/#intent=charge&device=`))
    } else throw new Error(`${at}: say "legacy app", "PHP" or "bundled screens".`)
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

  async soSignedIn(app: App, who: string) { await checkSignedIn(app, who) },

  /** The element's text (a field's value) is exactly this. Literal text is fine for a first version of a test; later, mark the text and check the marker. */
  async soText(app: App, id: string, value: string) {
    const el = app.page.getByTestId(id)
    const [v, at] = [text(app, value, id), `text "${id}": "${value}"`]
    if (await el.evaluate(e => ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.tagName))) await expect(el, at).toHaveValue(v, { timeout: 10_000 })
    else await expect(el, at).toHaveText(v, { timeout: 10_000 })
  }
}
