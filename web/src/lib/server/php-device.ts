// The device credentials the store app's bundled screens use with PHP's transaction API (the legacy app's /handoff).
// Card codes and device ids are made and encrypted by PHP, so node asks it rather than reading the DB.

import { env } from '$env/dynamic/private'
import { phpEndpointUrl } from './env'
import type { Device } from '$lib/app-shell'

const API_VERSION = '40206' // the legacy app's version, so PHP gives the current deviceId format

/** Return the session's account credentials (with the API address), or null if PHP refuses them (signed out, or the account can't use the app yet). */
export async function phpDevice(ssid: string): Promise<Device | null> {
  const res = await fetch(phpEndpointUrl('api/handoff'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: `${env.PHP_SSO_COOKIE_NAME}=${ssid}` },
    body: new URLSearchParams({ version: API_VERSION })
  })
  if (!res.ok) return null
  const account = (await res.json()).accounts?.[0]
  return account ? { ...account, api: phpEndpointUrl('api/') } : null
}
