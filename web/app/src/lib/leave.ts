import { enterUrl } from './auth'

// Back to the live dashboard, with a message for it to show (it travels in a short-lived cookie the dashboard reads and clears).
// A member signed in with a token arrives signed in: the server rebuilds the live site's cookie from the token (see enterUrl).
export async function toDashboard(live: string, msg = '', kind: 'info' | 'error' = 'info') {
  if (msg) {
    const host = location.hostname, parts = host.split('.')
    const domain = parts.length < 2 || /^\d+(\.\d+){3}$/.test(host) ? '' : '; domain=.' + parts.slice(-2).join('.')
    document.cookie = `cgpay-msg=${encodeURIComponent(kind + ':' + msg.slice(0, 300))}; path=/; max-age=120; samesite=lax${domain}${location.protocol == 'https:' ? '; secure' : ''}`
  }
  location.assign(await enterUrl() || live + '/')
}
