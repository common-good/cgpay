// Back to the live dashboard, with a message for it to show (it travels in a short-lived cookie the dashboard reads and clears).
export function toDashboard(live: string, msg = '', kind: 'info' | 'error' = 'info') {
  if (msg) document.cookie = `cgpay-msg=${encodeURIComponent(kind + ':' + msg.slice(0, 300))}; path=/; max-age=120; samesite=lax${msgDomain(location.hostname, live)}${location.protocol == 'https:' ? '; secure' : ''}`
  location.assign(live + '/')
}

/**
 * The cookie domain for the message: the smallest one both this host and the live dashboard's host are under, so other environments never see it
 * (app.test. and pay.test. share .test., not the whole site). '' (this host only) for the same host, an IP address, or hosts with nothing but a top-level domain in common.
 */
export function msgDomain(host: string, live: string) {
  const a = host.split('.').reverse(), b = new URL(live).hostname.split('.').reverse()
  let i = 0
  while (i < a.length && a[i] === b[i]) i++
  return i < 2 || (i == a.length && i == b.length) || /^\d+(\.\d+){3}$/.test(host) ? '' : '; domain=.' + a.slice(0, i).reverse().join('.')
}
