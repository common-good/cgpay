import u from '#utils.js'

const dashboardUrlKey = 'cgpay.handoff.dashboardUrl'

export function saveHandoffDashboardUrl(url) {
  sessionStorage.setItem(dashboardUrlKey, url)
}

export function isHandoffVisit() {
  return Boolean(sessionStorage.getItem(dashboardUrlKey))
}

/**
 * Go to the node dashboard if this visit came by handoff, else to the home screen.
 * @param string msg: message to show on the home screen (not shown when returning to the dashboard)
 */
export function returnFromHandoff(msg) {
  const dashboardUrl = sessionStorage.getItem(dashboardUrlKey)
  if (!dashboardUrl) return msg ? u.goHome(msg) : u.go('home')
  sessionStorage.removeItem(dashboardUrlKey)
  window.location.assign(dashboardUrl)
}
