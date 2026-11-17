import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { clearSsoCookie } from '$lib/server/sso-cookies'
import { appBack } from '$lib/server/app-cors'

// The store app signed out: clear the live site's session cookie in the app's WebView too, then go back to the app's own screens.
// back must be on one of the app's origins, so this is no open redirect; signing out is all it does (no harm if a page links here).
export const GET: RequestHandler = ({ url, cookies }) => {
  clearSsoCookie(cookies)
  throw redirect(303, appBack(url.searchParams.get('back') ?? ''))
}
