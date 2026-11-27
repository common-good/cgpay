// The transaction service on the live site (/api/app/identity, photo, tx), called with the sign-in token. Node asks PHP, which keeps the transaction engine.
import type { Device } from '$lib/app-shell'
import { call, token } from './auth'
import { noCardCode, type Card } from './qr'

const TIMEOUT_MS = 3200
export const TX_TIMEOUT_MS = 30000

export type Identity = { name: string, agent: string, location: string, limit: number, selling: string[], isell: string[] }

/** The service's answer. A failure status becomes an Error whose message is the status; no answer in time throws a TimeoutError. */
async function ask(op: string, params: object, ms = TIMEOUT_MS) {
  const { status, data } = await call(op, { token: await token(), ...params }, ms)
  if (status !== 200) throw new Error(String(status))
  return data
}

/** True when the request never got an answer (no connection or too slow), as opposed to any answer from the server, even a broken one. */
export const unreachable = (er: unknown) => er instanceof TypeError || (er as Error)?.name === 'TimeoutError'

const who = (d: Device, card: Card) => ({ actorId: noCardCode(d.accountId), otherId: card.acct + card.code })

/** What the server says about the other account: name, agent, location, how much they can spend, and the description choices. */
export async function identity(d: Device, card: Card): Promise<Identity> {
  const r = await ask('identity', who(d, card))
  if (!Number.isFinite(+(r?.limit ?? NaN))) throw new Error('502') // without the server's limit there is nothing to hold the amount to (an answer that is not JSON comes here too, so it is never taken for a lost connection)
  return { ...r, limit: +r.limit } as Identity
}

/** The other account's photo (empty if they have none). */
export async function idPhoto(d: Device, card: Card): Promise<Blob> {
  const p = (await ask('photo', who(d, card)))?.photo
  return p ? (await fetch(p)).blob() : new Blob()
}
