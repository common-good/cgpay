import u from '#utils.js'
import st from '#store.js'
import c from '#constants.js'

const dashboardUrlKey = 'cgpay.handoff.dashboardUrl'

export function saveHandoffDashboardUrl(url) {
  sessionStorage.setItem(dashboardUrlKey, url)
}

export function isHandoffVisit() {
  return Boolean(sessionStorage.getItem(dashboardUrlKey))
}

/**
 * True if Back should go to the dashboard: on the first page of a handoff visit, which is tx-start, or scan when tx-start was skipped.
 */
export function backGoesToDashboard() {
  if (!isHandoffVisit()) return false
  const trail = u.st().trail || []
  const cameFromHandoff = String(trail[trail.length - 1]).startsWith('handoff') // the page name includes the #intent=... part
  return u.onPage('tx-start') || (u.onPage('scan') && cameFromHandoff)
}

/**
 * Go to the node dashboard if this visit came by handoff, else to the home screen.
 * @param string msg: message to show there (on the dashboard, it travels in a short-lived cookie, see setDashboardMessage)
 * @param string kind: 'info' or 'error', how the dashboard shows the message
 */
export async function returnFromHandoff(msg, kind = 'info') {
  const dashboardUrl = sessionStorage.getItem(dashboardUrlKey)
  if (!dashboardUrl) return msg ? u.goHome(msg) : u.go('home')
  sessionStorage.removeItem(dashboardUrlKey)
  if (msg) setDashboardMessage(msg, kind)
  await sendQueuedTxs()
  window.location.assign(dashboardUrl)
}

/**
 * Leave a message for the dashboard in a cookie it reads and clears (the two apps share the parent domain, or localhost).
 * The cookie says 'info:' or 'error:' and then the text. The dashboard shows the text as plain text.
 */
function setDashboardMessage(msg, kind) {
  const host = location.hostname
  const parts = host.split('.')
  const domain = (parts.length < 2 || /^\d+(\.\d+){3}$/.test(host)) ? '' : '; domain=.' + parts.slice(-2).join('.')
  const secure = location.protocol == 'https:' ? '; secure' : ''
  document.cookie = `cgpay-msg=${encodeURIComponent(kind + ':' + String(msg).slice(0, 300))}; path=/; max-age=120; samesite=lax${domain}${secure}`
}

// u.go('home') comes here during a handoff visit: the new app's dashboard is home, and the message (see u.goHome and u.goEr) shows there.
u.toDashboard = () => {
  if (!isHandoffVisit()) return false
  const msg = u.st().erMsg // set by u.goHome and u.goEr
  const kind = u.msgKind || 'info'
  u.msgKind = null
  st.setMsg(null)
  returnFromHandoff(msg, kind)
  return true
}

/**
 * Send any queued transactions to the server before we leave this app, so the dashboard shows them.
 * (Normally they go out on the next network tick after leaving a transaction page, which never comes here.)
 * Gives up after a few seconds (eg offline); they stay queued and go out the next time this app runs.
 */
async function sendQueuedTxs() {
  st.setPending(false) // flushAll does nothing while a transaction is still open for undo
  const giveUp = new Promise(resolve => setTimeout(resolve, c.fetchTimeoutMs * 2))
  try { await Promise.race([st.flushAll(), giveUp]) } catch (er) { console.error('Could not send transactions before leaving.', er) }
}
