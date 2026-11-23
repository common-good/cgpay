// Transactions on the bundled screens: amount rules, the proof the server checks, and the queue that survives a closed app.
import type { Device } from '$lib/app-shell'
import { store } from '../storage'
import { TX_TIMEOUT_MS, type Identity } from './api'
import { call, token } from './auth'
import { noCardCode, type Card } from './qr'
import { env } from './env'

export const ONLINE_LIMIT = 10000 // the most any account can be charged on the app
export const money = (n: number | string) => (+n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export type Tx = { actorId: string, otherId: string, amount: string, description: string, created: number, proof: string, offline: boolean, pending: boolean, manager?: string, managerProof?: string, error?: string }

export const OFFLINE_LIMIT = 250 // how much an account not seen before can be charged without the server's word on what it has

const sha256 = async (s: string) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, '0')).join('')

/** The reason to refuse an amount, or '' if it is fine. */
export const checkAmount = (a: number, limit: number) =>
  a > ONLINE_LIMIT ? `CGPay transactions are limited to $${money(ONLINE_LIMIT)}`
  : a > limit ? `This transaction is limited to $${money(limit)}.`
  : a <= 0 ? 'The amount must be greater than zero.' : ''

/**
 * The transaction as the server wants it, with proof that this device made it (a hash of the amount, the accounts and the other's card code).
 * A payment from a cash register unlocked by a manager's card (manager) also carries that card's proof, since the server may see the register locked by the time it arrives.
 */
export async function makeTx(d: Device, card: Card, paying: boolean, amount: number, description: string, manager?: Card | null): Promise<Tx> {
  const actorId = noCardCode(d.accountId), amt = (paying ? -amount : amount).toFixed(2), created = Math.floor(Date.now() / 1000)
  const proofWith = (code: string) => sha256(actorId + amt + card.acct + code + created)
  const tx: Tx = { actorId, otherId: card.acct, amount: amt, description, created, proof: await proofWith(card.code), offline: true, pending: !(paying || d.isCo) }
  return paying && manager ? { ...tx, manager: manager.acct, managerProof: await proofWith(manager.code) } : tx
}

const key = (t: Tx) => `tx:${t.created}:${t.proof.slice(0, 8)}`

/** Keep the transaction until the server has it. Returns its key. */
export async function enqueue(t: Tx) { const k = key(t); await roomFor(() => store.set(k, t)); return k }

/** Forget a transaction that was never sent. */
export const unqueue = (k: string) => store.del(k)

let running: Promise<boolean> | null = null, next: Promise<boolean> | null = null

/**
 * Send every queued transaction, each on its own. One the server refuses is marked with the reason, to be shown once (see refusals): the server keeps it too, and tells the account.
 * No answer, the server's own server unavailable, or a sign-in that no longer works stops the run (the rest would fail the same way; returns true), and they go out next time.
 * Any other answer (a fault on the server) leaves the transaction to go out next time, without holding up the others.
 * Never two runs at once, or a transaction could go out twice: a call during a run waits for it, then all such calls share one more run (for what was queued meanwhile).
 */
export function flush(): Promise<boolean> {
  if (!running) return running = sendAll().finally(() => running = null)
  return next ??= running.then(() => { next = null; return flush() })
}

/** The server's own refusal, which it keeps (not an error page, or a fault on the way): no, with the reason. */
const refusal = (status: number, data: Record<string, unknown>) => (status === 200 && data.ok === false && !!data.message) || (status === 400 && !!data.message) || (status === 403 && ['bad-actor', 'locked'].includes(String(data.error)))

async function sendAll() {
  for (const [k, t] of await store.all<Tx>('tx:')) {
    if (t.error) continue
    let r
    try { r = await call('tx', { token: await token(), ...t }, TX_TIMEOUT_MS) } catch { return true }
    const { status, data } = r
    if (status === 401 || data.error === 'unavailable') return true
    if (status === 200 && data.ok === true) { await store.del(k); await seen(t.otherId, t.created * 1000) }
    else if (refusal(status, data)) await store.set(k, { ...t, error: String(data.message ?? data.error) })
  }
  return false
}

/** How many queued transactions still wait for the server (not counting refused ones). */
export const waiting = async () => (await store.all<Tx>('tx:')).filter(([, t]) => !t.error).length

const REASONS: Record<string, string> = { 'bad-actor': 'You may not act for that account.', locked: 'This device is a cash register. Only a manager can pay from it.' }

/** The refused transactions, each as its key and what to tell the member. Forget each (unqueue) once shown: the server keeps them. */
export async function refusals(): Promise<[string, string][]> {
  const out: [string, string][] = []
  for (const [k, t] of await store.all<Tx>('tx:')) if (t.error) {
    const name = (await store.get<Saved>(profileKey(t.otherId)))?.who.name || t.otherId
    const when = new Date(t.created * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    out.push([k, `${+t.amount < 0 ? 'Payment' : 'Charge'} of $${money(Math.abs(+t.amount))} to ${name} on ${when}: ${REASONS[t.error] ?? t.error}`])
  }
  return out
}

// What is kept of accounts seen before, for when the server cannot be reached, per env (an account number may mean another account on another server):
// a profile and, for an account charged, a small copy of its photo. The profile is kept with a hash of the card code, so a different code gets neither,
// and the profile with when the account was last used (t: seen online, or a transaction with it accepted). Both are only a convenience,
// so they go together, the least used first, when the phone is out of space, and after a year unused.
type Saved = { who: Identity, h: string, t?: number }
const DAY = 86_400_000, YEAR = 365 * DAY
const profileKey = (acct: string) => `acct:${env()}:${acct}`
const photoKey = (acct: string) => `photo:${env()}:${acct}`
const idOf = (k: string) => k.slice(k.indexOf(':') + 1) // env:account

export const cacheProfile = async (c: Card, who: Identity) => roomFor(async () => store.set(profileKey(c.acct), { who, h: await sha256(c.code), t: Date.now() })).catch(() => {})
export const cachePhoto = async (c: Card, jpeg: Uint8Array) => roomFor(() => store.set(photoKey(c.acct), jpeg)).catch(() => {})

/** The photo kept for this card, as an address an img can show ('' if none, or if its profile was kept for another card code). */
export async function offlinePhoto(c: Card) {
  const p = await store.get<Saved>(profileKey(c.acct)), jpeg = p?.h === await sha256(c.code) && await store.get<Uint8Array<ArrayBuffer>>(photoKey(c.acct))
  return jpeg ? URL.createObjectURL(new Blob([jpeg], { type: 'image/jpeg' })) : ''
}

// A transaction with the account was accepted: its profile counts as used then, unless it was seen online since.
async function seen(acct: string, when: number) {
  const p = await store.get<Saved>(profileKey(acct))
  if (p && (p.t ?? 0) < when) await store.set(profileKey(acct), { ...p, t: when }).catch(() => {})
}

// The accounts with anything kept, least recently used first (a photo whose profile is gone, first of all). Reads every profile.
async function byUse() {
  const t = new Map((await store.all<Saved>('acct:')).map(([k, p]) => [idOf(k), p.t ?? 0]))
  const ids = new Set([...t.keys(), ...(await store.keys('photo:')).map(idOf)])
  return [...ids].map(id => [id, t.get(id) ?? 0] as const).sort(([, a], [, b]) => a - b)
}
const forget = async (id: string) => { await store.del(`acct:${id}`); await store.del(`photo:${id}`) }

/** Forget the accounts not used for a year. At most once a day, since it reads every profile. */
export async function dropUnused(now = Date.now()) {
  if ((await store.get<number>('unusedChecked') ?? 0) > now - DAY) return
  for (const [id, t] of await byUse()) if (t < now - YEAR) await forget(id)
  await store.set('unusedChecked', now).catch(() => {})
}

/** Write; if that fails (the phone may be out of space), forget the two least recently used accounts kept and try once more. */
async function roomFor(write: () => Promise<void>) {
  try { return await write() } catch { /* make room below */ }
  for (const [id] of (await byUse()).slice(0, 2)) await forget(id)
  await write()
}

/** The profile to go by when offline: the one saved earlier for this card, else a blank one with the offline limit. */
export async function offlineProfile(c: Card): Promise<Identity> {
  const saved = await store.get<Saved>(profileKey(c.acct))
  return saved && saved.h === await sha256(c.code) ? saved.who : { name: '', agent: '', location: '', limit: OFFLINE_LIMIT, selling: [], isell: [] }
}
