import { error, redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { callPhp } from '$lib/server/php-client'
import { phpSso } from '$lib/server/php-login'
import { setSsoCookies } from '$lib/server/sso-cookies'

// The store app opens a live page with a one-time code (from /api/app/enter): trade it for a PHP session, set the cookies, and go to the page.
// The code works once and lives a minute, so a copied link is useless.
export const GET: RequestHandler = async ({ url, cookies }) => {
  const c = url.searchParams.get('c')
  if (!c) throw error(400, 'Missing code.')
  const r = await callPhp<{ uid: number, account: number, to: string, tokenId?: number }>('cgpay/redeem', { body: { code: c } })
  if (!r.ok) throw error(401, 'This link has expired. Open it again from the app.')
  const sso = await phpSso(r.data.uid, r.data.account, r.data.tokenId ?? 0)
  if (!sso) throw error(502, 'Unable to sign you in. Please try again.')
  setSsoCookies(cookies, sso)
  const to = r.data.to
  throw redirect(303, to !== 'dashboard' && /^[a-z0-9][a-z0-9/_?&=.%-]*$/i.test(to) ? `/${to}` : '/') // a path on this site only, whatever PHP says
}
