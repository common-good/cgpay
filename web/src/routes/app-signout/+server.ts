import type { RequestHandler } from './$types'
import { clearSsoCookie } from '$lib/server/sso-cookies'
import { appBack } from '$lib/server/app-cors'

// The store app signed out: clear the live site's session cookie in the app's WebView too, then go back to the app's own screens.
// back must be on one of the app's origins, so this is no open redirect; signing out is all it does (no harm if a page links here).
// A page that navigates by script, not a redirect: Android's WebView follows a redirect without letting the app serve its own
// https://localhost screens, so a redirect there fails with ERR_CONNECTION_REFUSED.
export const GET: RequestHandler = ({ url, cookies }) => {
  clearSsoCookie(cookies)
  const back = JSON.stringify(appBack(url.searchParams.get('back') ?? '')).replace(/</g, '\\u003c')
  return new Response(`<!doctype html><meta charset="utf-8"><title>Signed out</title><script>location.replace(${back})</script>`, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }
  })
}
