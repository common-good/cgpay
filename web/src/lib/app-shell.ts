// The live site also runs inside the store app's WebView, which marks its user agent (appendUserAgent in capacitor.config.ts).
export const inApp = () => typeof navigator !== 'undefined' && navigator.userAgent.includes('CGPayApp')

// What the bundled screens need to transact with PHP's API on the account's behalf. The app fetches it with its token (/api/app/device), never from a page.
// api is PHP's transaction API (base address, ends in a slash); real is true on production, where QR codes are the real ones.
export type Device = { accountId: string, qr: string, isCo: boolean, name: string, selling: string[] | null, real: boolean, php: string }

/**
 * The URL of the app's bundled screens, with these parameters in the hash (which never reaches a server; undefined ones are left out).
 * The screens are served from the app package, under a different origin on each platform; base overrides it (the tests serve them from a port).
 */
export function appUrl(params: Record<string, string | number | undefined> = {}, base = '') {
  const origin = base.replace(/\/+$/, '') || (/iPhone|iPad|Macintosh/.test(navigator.userAgent) ? 'capacitor://localhost' : 'https://localhost')
  return `${origin}/#${new URLSearchParams(Object.entries(params).flatMap(([k, v]) => v === undefined ? [] : [[k, String(v)]]))}`
}
