// PHP's transaction API, called with the device credentials the live dashboard handed over.
import type { Device } from '$lib/app-shell'
import { noCardCode, type Card } from './qr'

const VERSION = 40206 // the legacy app's version number, which the server's rules for old and new apps go by
const TIMEOUT_MS = 3200

export type Identity = { name: string, agent: string, location: string, limit: number, selling: string[], isell: string[] }

// POST to an endpoint and return the Response. A failure status becomes an Error whose message is the status; no answer in time throws a TimeoutError.
async function post(d: Device, endpoint: string, params: Record<string, string | number>) {
  const res = await fetch(d.api + endpoint, {
    method: 'POST',
    headers: { 'Content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(Object.entries({ version: VERSION, ...params }).map(([k, v]) => [k, String(v)])),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  })
  if (!res.ok) throw new Error(String(res.status))
  return res
}

const who = (d: Device, card: Card) => ({ deviceId: d.deviceId, actorId: noCardCode(d.accountId), otherId: card.acct + card.code })

/** What the server says about the other account: name, agent, location, how much they can spend, and the description choices. */
export const identity = async (d: Device, card: Card): Promise<Identity> => (await post(d, 'identity', who(d, card))).json()

/** The other account's photo, as an address a page can show. */
export const idPhoto = async (d: Device, card: Card) => URL.createObjectURL(await (await post(d, 'idPhoto', who(d, card))).blob())
