// The envs the app can be in: the one this build starts at (START) and demo. A real card (RC2.ME) belongs to START, a test card (RC4.ME) to demo;
// scanning the other kind switches the app. Each env keeps its own sign-in on the phone, so switching back does not ask again.
import { store } from '../storage'
import { secret } from './secure'

export const START: string = import.meta.env.VITE_START_ENV || 'test'
const urls: Record<string, string | undefined> = { [START]: import.meta.env.VITE_LIVE_URL, demo: import.meta.env.VITE_DEMO_URL }

/** The env the app is in now (a pointer in localStorage, so it can be read at once; the sign-in itself is in the store). */
export const env = (): string => { try { return localStorage.getItem('env') || START } catch { return START } }
export const isDemo = () => env() === 'demo'

/** The pay site of an env (the tests point the envs at the server under test). */
export const liveOf = (e: string) => (urls[e] || `https://pay.${e}.commongood.earth`).replace(/\/$/, '')
export const live = () => liveOf(env())

/** Whether a card of this kind (see cardKind) is not for the env the app is in. */
export const mismatch = (kind: 'test' | 'real') => (kind === 'test') === !isDemo()

/** Where a card of the other kind takes the app, or null when it must stay put (a build that starts at demo has no real env to go back to). */
export const target = (kind: 'test' | 'real') => kind === 'test' ? 'demo' : START === 'demo' ? null : START

const KEYS = ['member', 'acct', 'device', 'dftAcct'] // what an env keeps on the phone besides its token
const at = (e: string, k: string) => `env:${e}:${k}`
const put = (k: string, v: unknown) => v === undefined ? store.del(k) : store.set(k, v)

/** Leave this env's sign-in on the shelf and take the other's down (nothing if it has none), then make that env the current one. */
export async function switchTo(to: string) {
  const from = env()
  if (to === from) return
  for (const k of KEYS) { await put(at(from, k), await store.get(k)); await put(k, await store.get(at(to, k))) }
  const t = await secret.get('token'), t2 = await secret.get(at(to, 'token'))
  if (t) await secret.set(at(from, 'token'), t); else await secret.del(at(from, 'token'))
  if (t2) await secret.set('token', t2); else await secret.del('token')
  localStorage.setItem('env', to)
}

/** Whether the phone is still signed in to that env for the card's account (then switching needs no sign-in). main is the card's main account id. */
export async function signedInFor(e: string, main: string, mainOf: (id: string) => string) {
  const m = await store.get<{ accounts: { device: { accountId: string } | null }[] }>(at(e, 'member'))
  return !!await secret.get(at(e, 'token')) && !!m?.accounts.some(a => a.device && mainOf(a.device.accountId) === main)
}

/** Forget the sign-ins kept for the other envs (when signing out), and return their tokens so they can be ended on their servers. */
export async function dropShelved() {
  const out: { env: string, token: string }[] = []
  for (const e of new Set([START, 'demo'])) {
    if (e === env()) continue
    const token = await secret.get(at(e, 'token'))
    if (token) out.push({ env: e, token })
    await secret.del(at(e, 'token'))
    for (const k of KEYS.filter(k => k !== 'dftAcct')) await store.del(at(e, k))
  }
  return out
}
