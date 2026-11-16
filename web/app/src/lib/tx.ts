// Transactions on the bundled screens: amount rules, the proof the server checks, and the queue that survives a closed app.
import type { Device } from '$lib/app-shell'
import { store } from '../storage'
import { post, unreachable, VERSION, type Identity } from './api'
import { noCardCode, type Card } from './qr'

export const ONLINE_LIMIT = 10000 // the most any account can be charged on the app
export const money = (n: number | string) => (+n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export type Tx = { actorId: string, otherId: string, amount: string, description: string, created: number, proof: string, deviceId: string, offline: boolean, pending: boolean, version: number, error?: string }

export const OFFLINE_LIMIT = 250 // how much an account not seen before can be charged without the server's word on what it has

const sha256 = async (s: string) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, '0')).join('')

/** The rounded amount and the reason to refuse it (or '' if fine). The rounded amount comes back so the form can show it. */
export function checkAmount(typed: number, limit: number): [number, string] {
  const a = +typed.toFixed(2)
  const err = a != typed ? 'The amount has been rounded to two decimal places. Make sure this is what you intended and try again.'
    : a > ONLINE_LIMIT ? `CGPay transactions are limited to $${money(ONLINE_LIMIT)}`
    : a > limit ? `This transaction is limited to $${money(limit)}.`
    : a <= 0 ? 'The amount must be greater than zero.' : ''
  return [a, err]
}

/** The transaction as the server wants it, with proof that this device made it (a hash of the amount, the accounts and the other's card code). */
export async function makeTx(d: Device, card: Card, paying: boolean, amount: number, description: string): Promise<Tx> {
  const actorId = noCardCode(d.accountId), amt = (paying ? -amount : amount).toFixed(2), created = Math.floor(Date.now() / 1000)
  return { actorId, otherId: card.acct, amount: amt, description, created, proof: await sha256(actorId + amt + card.acct + card.code + created), deviceId: d.deviceId, offline: true, pending: !(paying || d.isCo), version: VERSION }
}

const key = (t: Tx) => `tx:${t.created}:${t.proof.slice(0, 8)}`

/** Keep the transaction until the server has it. Returns its key. */
export async function enqueue(t: Tx) { const k = key(t); await store.set(k, t); return k }

/** Forget a transaction that was never sent. */
export const unqueue = (k: string) => store.del(k)

/**
 * Send every queued transaction, each on its own: one the server refuses is kept with the reason and does not hold up the others.
 * A network failure stops the run (the rest would fail the same way; returns true) and they go out next time.
 */
export async function flush(d: Device): Promise<boolean> {
  for (const [k, t] of await store.all<Tx>('tx:')) {
    if (t.error) continue
    try {
      const res = await (await post(d, 'transactions', { ...t })).json().catch(() => ({ ok: true }))
      if (res?.ok === false) await store.set(k, { ...t, error: String(res.message ?? 'refused') }); else await store.del(k)
    } catch (er) {
      if (unreachable(er)) return true
      await store.set(k, { ...t, error: (er as Error).message })
    }
  }
  return false
}

/** How many queued transactions still wait for the server (not counting refused ones). */
export const waiting = async () => (await store.all<Tx>('tx:')).filter(([, t]) => !t.error).length

// Profiles of accounts seen before, for when the server cannot be reached. Kept with a hash of the card code, so a different code does not get the old profile.
const profileKey = (c: Card) => `acct:${c.acct}`
export const cacheProfile = async (c: Card, who: Identity) => store.set(profileKey(c), { who, h: await sha256(c.code) })

/** The profile to go by when offline: the one saved earlier for this card, else a blank one with the offline limit. */
export async function offlineProfile(c: Card): Promise<Identity> {
  const saved = await store.get<{ who: Identity, h: string }>(profileKey(c))
  return saved && saved.h === await sha256(c.code) ? saved.who : { name: '', agent: '', location: '', limit: OFFLINE_LIMIT, selling: [], isell: [] }
}
