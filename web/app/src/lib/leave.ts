import { enterUrl } from './auth'

// Back to the live dashboard, with a message for it to show in the address (#msg=kind:text; a fragment never reaches a server).
// A member signed in with a token arrives signed in: the server rebuilds the live site's cookie from the token (see enterUrl);
// the fragment survives its redirect to the dashboard.
export async function toDashboard(live: string, msg = '', kind: 'info' | 'error' = 'info') {
  const hash = msg ? '#' + new URLSearchParams({ msg: kind + ':' + msg.slice(0, 300) }) : ''
  location.assign((await enterUrl() || live + '/') + hash)
}

