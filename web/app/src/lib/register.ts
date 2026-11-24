// The app as a company's cash register. A company account (only its managers can choose one) opens to Charge with everything else locked,
// until a manager unlocks it with their card or the token owner's password. The server enforces the lock too: a locked token works for the company alone
// (PHP's /cgpay/lock and /cgpay/unlock). An unlock lasts until IDLE_MS pass without a touch, MAX_MS pass since it began, or the activity it was for is over.
import { store } from '../storage'
import { lockCall, token, unlock } from './auth'
import { keepMember, member, type Account, type Member } from './accounts'
import { parseQr, type Card } from './qr'
import { env } from './env'

export const IDLE_MS = 120000, MAX_MS = 300000 // the server's limits too (APP_UNLOCK_SECS, APP_UNLOCK_MAX_SECS)
export type Scope = 'full' | 'company' // another manager's card opens only the company; the token owner's password or own card opens everything

const CARDS = 'mgrCards', PENDING = 'pendingLock', UNLOCKED = 'unlocked'
type Card = { acct: string, salt: string, hash: string }

/**
 * The companies that act as personal accounts on this phone (the owner-operated setting): no lock. Like every account setting, it survives changes of account
 * (and sign-outs); it is kept per env, since a uid names different accounts on different servers.
 */
const ownerKey = () => `ownerOp:${env()}`
export const ownerOperated = async () => (await store.get<number[]>(ownerKey())) ?? []
export async function setOwnerOperated(uid: number, on: boolean) {
  const list = (await ownerOperated()).filter(u => u !== uid)
  await store.set(ownerKey(), on ? [...list, uid] : list)
}

/** Whether the account is a cash register on this phone: a company, not owner-operated, signed in with a token (the lock needs the server). */
export const isRegister = async (a: Account | null) => !!a?.isCo && !!await token() && !(await ownerOperated()).includes(a.uid)

type Unlock = { scope: Scope, since: number, until: number }

/** The unlock still in force (the bundled screens start again after each visit to the live site), or null. Each call slides it forward. */
export async function unlocked() {
  const u = await store.get<Unlock>(UNLOCKED)
  return (!u || u.until < Date.now()) ? null : touch(u.scope, u.since)
}

/** When an unlock that began at since ends, if the phone is touched now. */
export const endOf = (since: number) => Math.min(Date.now() + IDLE_MS, since + MAX_MS)

export async function touch(scope: Scope, since = Date.now()) {
  const u: Unlock = { scope, since, until: endOf(since) }
  await store.set(UNLOCKED, u)
  return u
}

/** Lock the phone to the company: forget every other account's credentials here at once, and tell the server (later, if there is no connection). */
export async function lock(co: Account) {
  await store.del(UNLOCKED)
  const m = await member()
  if (m) await store.set('member', { ...m, accounts: m.accounts.filter(a => a.uid === co.uid), lockedTo: co.uid })
  await store.set(PENDING, co.uid)
  await sendLock()
}

/** Tell the server about a lock made on the phone. A token already locked (by another manager's unlock, say) just has its unlock ended. */
export async function sendLock() {
  const uid = await store.get<number>(PENDING)
  if (uid === undefined) return
  try {
    let r = await lockCall(uid)
    if (r.status === 403 && r.data.error === 'locked') r = await lockCall()
    if (r.status === 200) await keepMember(r.data as Member)
    if (r.status !== 502 && r.status !== 429) await store.del(PENDING)
  } catch { /* no connection: try again next time */ }
}

/** Stop being a cash register (another account chosen, or the owner-operated setting): the server lets the token go for good. Needs a connection and the token owner's own unlock. */
export async function release() {
  await store.del(PENDING); await store.del(UNLOCKED)
  const r = await lockCall(0)
  if (r.status === 200) await keepMember(r.data as Member)
  return r.status === 200
}

/**
 * Unlock with the token owner's password or a manager's card (qr). Online, the server checks and sends back what the unlock opens;
 * offline, a card unlocks (the company only) if it unlocked this phone online before. Returns the scope, or an error code.
 */
export async function unlockBy(how: { password?: string, qr?: string }, real: boolean): Promise<{ scope?: Scope, card?: Card, error?: string }> {
  await sendLock()
  try {
    const { data } = await unlock(how)
    if (!data.ok) { if (data.error === 'not-manager' && how.qr) await forgetCard(how.qr, real); return { error: data.error } }
    if (data.accounts) await keepMember(data as Member)
    const scope: Scope = how.password || data.unlockedBy === (await member())?.uid ? 'full' : 'company'
    if (how.qr) await keepCard(how.qr, real)
    await touch(scope)
    return { scope, card: how.qr ? cardOf(how.qr, real) ?? undefined : undefined }
  } catch {
    if (!how.qr || !await knownCard(how.qr, real)) return { error: 'offline' }
    await touch('company')
    return { scope: 'company', card: cardOf(how.qr, real) ?? undefined }
  }
}

const hex = (b: ArrayBuffer | Uint8Array) => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('')

/** A slow salted hash of a card code (PBKDF2), so the codes kept for unlocking offline cannot be read back from the phone. */
async function slowHash(code: string, salt: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveBits'])
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 200000 }, key, 256))
}

const cardOf = (qr: string, real: boolean) => { try { return parseQr(qr, real) } catch { return null } }
const cards = async () => (await store.get<Card[]>(CARDS)) ?? []

async function keepCard(qr: string, real: boolean) {
  const c = cardOf(qr, real)
  if (!c) return
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)))
  await store.set(CARDS, [...(await cards()).filter(k => k.acct !== c.acct), { acct: c.acct, salt, hash: await slowHash(c.code, salt) }])
}

async function forgetCard(qr: string, real: boolean) {
  const c = cardOf(qr, real)
  if (c) await store.set(CARDS, (await cards()).filter(k => k.acct !== c.acct))
}

async function knownCard(qr: string, real: boolean) {
  const c = cardOf(qr, real), k = c && (await cards()).find(k => k.acct === c.acct)
  return !!k && await slowHash(c!.code, k.salt) === k.hash
}
