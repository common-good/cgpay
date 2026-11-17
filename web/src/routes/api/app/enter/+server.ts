import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { appCall } from '$lib/server/app-api'

// The app opens a live page: swap its token for a one-time link that rebuilds the cookie session on this site (see /app-enter).
export const POST: RequestHandler = async ({ request, getClientAddress, url }) => {
  const { status, data } = await appCall('enter', request, getClientAddress(), ['token', 'to'])
  if (status !== 200) return json(data, { status, headers: { 'Cache-Control': 'no-store' } })
  const { code, to } = data as { code: string, to: string }
  return json({ url: `${url.origin}/app-enter?${new URLSearchParams({ c: code, to })}` }, { headers: { 'Cache-Control': 'no-store' } })
}
