// The app's sign-in: a revocable token (kept in secure storage) instead of a password or a cookie. The server side is /api/app/* on the live site.
import { Capacitor } from '@capacitor/core'
import { store } from '../storage'
import { secret } from './secure'
import { dropShelved, live, liveOf } from './env'
import { current, forget, keepMember, type Account, type Member } from './accounts'

export type Reply = { status: number, data: Record<string, any> }
export type Signed = Member & { token: string }

/** POST JSON to the live site's /api/app/<op>. Rejects when there is no answer (no connection, or too slow). */
async function call(op: string, body: object, ms = 20000, base = live()): Promise<Reply> {
  const res = await fetch(`${base}/api/app/${op}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(ms) })
  return { status: res.status, data: await res.json().catch(() => ({})) }
}

/** A random key made once per installation. The server remembers a trusted device by it, so trust outlasts a sign-out. */
async function deviceKey() {
  let k = await secret.get('deviceKey')
  if (!k) await secret.set('deviceKey', k = [...crypto.getRandomValues(new Uint8Array(24))].map(b => b.toString(16).padStart(2, '0')).join(''))
  return k
}

const label = () => `${Capacitor.getPlatform()} app`

/** Step 1: the reply has a token (signed in), or an mfa handle (ask for the emailed passcode), or an error code. */
export const signIn = async (identifier: string, password: string) => call('signin', { identifier, password, label: label(), deviceKey: await deviceKey() })

/** Step 2: the emailed passcode, and whether to skip this step on this device from now on (base: another env's pay site, for a card sign-in). */
export const confirmCode = (mfa: string, code: string, trust: boolean, base?: string) => call('mfa', { mfa, code, trust: trust ? 1 : 0 }, 20000, base)

/** Sign in to another env by a scanned card (before the app moves there): demo takes the card alone, the real env also wants the cardholder's password. The reply is as for signIn, plus the account to act for. */
export const cardSignIn = async (to: string, qr: string, password: string, skipMfa: boolean) => call('card', { qr, password, skipMfa, label: label(), deviceKey: await deviceKey() }, 20000, liveOf(to))

/** Keep what a sign-in gave: the token (secret) and the member's accounts, choosing the phone's default one. */
export async function keep(s: Signed) {
  await secret.set('token', s.token)
  await keepMember({ uid: s.uid, admin: s.admin, accounts: s.accounts }, true)
}

export const token = () => secret.get('token')

/** Fetch the member's accounts and their credentials again, and keep them. 'out' means the token is no longer good (signed out elsewhere, expired), 'offline' that nobody answered (or the answer is stale). */
export async function refresh(): Promise<{ state: 'ok', account: Account | null } | { state: 'out' | 'offline' }> {
  const t = await token()
  if (!t) return { state: 'out' }
  try {
    const { status, data } = await call('device', { token: t })
    if (await token() !== t) return { state: 'offline' } // signed out (or in again) meanwhile: what came back is stale, so keep nothing
    if (status === 401) return { state: 'out' }
    if (status !== 200) return { state: 'offline' }
    await keepMember(data as Member)
    return { state: 'ok', account: await current() }
  } catch { return { state: 'offline' } }
}

/** The address that opens a live page signed in (the server rebuilds the live site's cookie from the token), or '' if that can't be had now. */
export async function enterUrl(to = 'dashboard'): Promise<string> {
  const t = await token()
  if (!t) return ''
  try {
    const { status, data } = await call('enter', { token: t, to, account: (await current())?.uid ?? 0 }, 8000)
    return status === 200 ? data.url : ''
  } catch { return '' }
}

/**
 * Sign out: end the token on the server if it can be reached, then forget the token, the device credentials and anything still waiting to send.
 * Returns whether the server was reached (so the live site's cookie can be cleared too, see App.svelte).
 */
export async function signOut() {
  const t = await token()
  const reached = !!t && await call('revoke', { token: t }, 8000).then(() => true, () => false)
  await secret.del('token')
  await forget()
  for (const o of await dropShelved()) call('revoke', { token: o.token }, 8000, liveOf(o.env)).catch(() => {}) // the other env's sign-in goes too; its server forgets it when it can be reached
  for (const [k] of await store.all('tx:')) await store.del(k)
  return reached
}

/** An account an admin typed (code, email, phone or name): the reply has account, or an error code. Rejects with no connection. */
export const typeAccount = async (who: string) => call('account', { token: await token(), who })

/** The password again, before changing account or settings (when the settings ask for it). Rejects with no connection. */
export const unlock = async (password: string) => call('unlock', { token: await token(), password })
