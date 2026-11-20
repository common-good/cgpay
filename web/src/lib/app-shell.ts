// The live site also runs inside the store app's WebView, which marks its user agent (appendUserAgent in capacitor.config.ts).
export const inApp = () => typeof navigator !== 'undefined' && navigator.userAgent.includes('CGPayApp')

// What the bundled screens need to transact with PHP's API on the account's behalf (see /api/me/device).
// api is PHP's transaction API (base address, ends in a slash); real is true on production, where QR codes are the real ones.
export type Device = { accountId: string, cardCode: string, deviceId: string, qr: string, isCo: boolean, name: string, selling: string[] | null, real: boolean, api: string }

let asked: { who: string, device: Promise<Device | null> } | undefined

/** The signed-in account's device credentials, fetched once per account and page load (null if the server refuses). */
export function device(who: string): Promise<Device | null> {
  if (asked?.who !== who) asked = { who, device: fetch('/api/me/device', { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null) }
  return asked.device
}

/**
 * The URL of the app's bundled screens, with these parameters in the hash (which never reaches a server).
 * The screens are served from the app package, under a different origin on each platform; base overrides it (the tests serve them from a port).
 */
export function appUrl(params: Record<string, string> = {}, base = '') {
  const origin = base.replace(/\/+$/, '') || (/iPhone|iPad|Macintosh/.test(navigator.userAgent) ? 'capacitor://localhost' : 'https://localhost')
  return `${origin}/#${new URLSearchParams(params)}`
}

/** A bundled-screen link that hands over the device credentials, or '' until they arrive. */
export const appLink = (dev: Device | null, params: Record<string, string> = {}, base = '') => dev ? appUrl({ ...params, device: JSON.stringify(dev) }, base) : ''
