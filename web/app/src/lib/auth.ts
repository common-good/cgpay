// The app's sign-in: a revocable token (kept in secure storage) instead of a password or a cookie. The server side is /api/app/* on the live site.
import { Capacitor } from '@capacitor/core'
import type { Device } from '$lib/app-shell'
import { store } from '../storage'
import { secret } from './secure'
import { live } from './live'

export type Reply = { status: number, data: Record<string, any> }
export type Signed = { token: string, uid: number, device: Device | null }

/** POST JSON to the live site's /api/app/<op>. Rejects when there is no answer (no connection, or too slow). */
async function call(op: string, body: object, ms = 20000): Promise<Reply> {
  const res = await fetch(`${live}/api/app/${op}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(ms) })
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

/** Step 2: the emailed passcode, and whether to skip this step on this device from now on. */
export const confirmCode = (mfa: string, code: string, trust: boolean) => call('mfa', { mfa, code, trust: trust ? 1 : 0 })

/** Keep what a sign-in gave: the token (secret) and the device credentials the transaction screens use. */
export async function keep(s: Signed) {
  await secret.set('token', s.token)
  if (s.device) await store.set('device', s.device); else await store.del('device')
}

export const token = () => secret.get('token')

/** Fetch the device credentials again, and keep them. 'out' means the token is no longer good (signed out elsewhere, expired), 'offline' that nobody answered (or the answer is stale). */
export async function refresh(): Promise<{ state: 'ok', device: Device | null } | { state: 'out' | 'offline' }> {
  const t = await token()
  if (!t) return { state: 'out' }
  try {
    const { status, data } = await call('device', { token: t })
    if (await token() !== t) return { state: 'offline' } // signed out (or in again) meanwhile: what came back is stale, so keep nothing
    if (status === 401) return { state: 'out' }
    if (status !== 200) return { state: 'offline' }
    if (data.device) await store.set('device', data.device); else await store.del('device')
    return { state: 'ok', device: data.device ?? null }
  } catch { return { state: 'offline' } }
}

/** The address that opens a live page signed in (the server rebuilds the live site's cookie from the token), or '' if that can't be had now. */
export async function enterUrl(to = 'dashboard'): Promise<string> {
  const t = await token()
  if (!t) return ''
  try {
    const { status, data } = await call('enter', { token: t, to }, 8000)
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
  await store.del('device')
  for (const [k] of await store.all('tx:')) await store.del(k)
  return reached
}
