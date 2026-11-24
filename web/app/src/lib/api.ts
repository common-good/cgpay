// PHP's transaction API, called with the device credentials the live dashboard handed over.
import type { Device } from '$lib/app-shell'
import { noCardCode, type Card } from './qr'

export const VERSION = 40206 // the legacy app's version number, which the server's rules for old and new apps go by
const TIMEOUT_MS = 3200
export const TX_TIMEOUT_MS = 30000

export type Identity = { name: string, agent: string, location: string, limit: number, selling: string[], isell: string[] }

// POST to an endpoint and return the Response. A failure status becomes an Error whose message is the status; no answer in time throws a TimeoutError.
export async function post(d: Device, endpoint: string, params: Record<string, string | number | boolean | undefined>, ms = TIMEOUT_MS) {
  const res = await fetch(d.api + endpoint, {
    method: 'POST',
    headers: { 'Content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(Object.entries({ version: VERSION, ...params }).map(([k, v]) => [k, String(v)])),
    signal: AbortSignal.timeout(ms)
  })
  if (!res.ok) throw new Error(String(res.status))
  return res
}

/** True when the request never got an answer (no connection or too slow), as opposed to any answer from the server, even a broken one. */
export const unreachable = (er: unknown) => er instanceof TypeError || (er as Error)?.name === 'TimeoutError'

/** The answer's JSON. An answer that is not JSON (a PHP error page, say) fails as a 502, like any server failure, so it is never taken for a lost connection. */
export async function body(res: Response) { try { return await res.json() } catch { throw new Error('502') } }

const who = (d: Device, card: Card) => ({ deviceId: d.deviceId, actorId: noCardCode(d.accountId), otherId: card.acct + card.code })

/** What the server says about the other account: name, agent, location, how much they can spend, and the description choices. */
export async function identity(d: Device, card: Card): Promise<Identity> {
  const r = await body(await post(d, 'identity', who(d, card)))
  if (!Number.isFinite(+(r?.limit ?? NaN))) throw new Error('502') // without the server's limit there is nothing to hold the amount to
  return { ...r, limit: +r.limit }
}

/** The other account's photo, as an address a page can show. */
export const idPhoto = async (d: Device, card: Card) => (await post(d, 'idPhoto', who(d, card))).blob()
