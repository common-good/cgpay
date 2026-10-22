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
 * @param string msg: message to show on the home screen (not shown when returning to the dashboard)
 */
export async function returnFromHandoff(msg) {
  const dashboardUrl = sessionStorage.getItem(dashboardUrlKey)
  if (!dashboardUrl) return msg ? u.goHome(msg) : u.go('home')
  sessionStorage.removeItem(dashboardUrlKey)
  await sendQueuedTxs()
  window.location.assign(dashboardUrl)
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
