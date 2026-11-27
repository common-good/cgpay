// The envs the app can be in: the one this build starts at (START) and demo. A real card (RC2.ME) belongs to START, a test card (RC4.ME) to demo;
// scanning the other kind switches the app. Each env keeps its own sign-in on the phone, so switching back does not ask again.
import { store } from '../storage'
import { secret } from './secure'

export const START: string = import.meta.env.VITE_START_ENV || 'test'
const urls: Record<string, string | undefined> = { [START]: import.meta.env.VITE_LIVE_URL, demo: import.meta.env.VITE_DEMO_URL }

/** The env the app is in now: a pointer in localStorage so it can be read at once, and also kept with the tokens (restoreEnv), since a phone can clear a WebView's storage and leave the Keychain alone. */
export const env = (): string => { try { return localStorage.getItem('env') || START } catch { return START } }
export const isDemo = () => env() === 'demo'

/** The env a token is for: each server tags its tokens with its stage ("demo." on demo; beta's say "main."), so only demo's tell which env. */
const envOfToken = (t: string) => t.startsWith('demo.') ? 'demo' : t.includes('.') ? START : undefined

/**
 * At startup, put the pointer right, so a token is never used on the wrong env's server: the current token says which env it is for;
 * without one, the Keychain's pointer wins over localStorage (which a phone may clear). A switch cut short after the current token went
 * (see switchTo) gets that env's token back from the shelf.
 */
export async function restoreEnv() {
  const t = await secret.get('token')
  const e = (t && envOfToken(t)) || await secret.get('env') || env()
  if (e !== env()) try { localStorage.setItem('env', e) } catch { /* no localStorage: the Keychain's pointer is then all there is */ }
  if (e !== await secret.get('env')) await secret.set('env', e)
  const shelved = t ? undefined : await secret.get(at(e, 'token'))
  if (shelved) { await secret.set('token', shelved); for (const k of KEYS) if (await store.get(k) === undefined) await put(k, await store.get(at(e, k))) }
}

/** Back to the build's own env (after signing out of everything). */
export async function resetEnv() {
  await secret.del('env')
  try { localStorage.removeItem('env') } catch { /* nothing kept */ }
}

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

const putSecret = (k: string, v: string | undefined) => v ? secret.set(k, v) : secret.del(k)

/**
 * Leave this env's sign-in on the shelf and take the other's down (nothing if it has none), then make that env the current one.
 * Copy, then overwrite, then move the pointer, then clear the shelf taken down: a switch cut short at any step loses no sign-in, and restoreEnv repairs the rest.
 */
export async function switchTo(to: string) {
  const from = env()
  if (to === from) return
  for (const k of KEYS) await put(at(from, k), await store.get(k))
  await putSecret(at(from, 'token'), await secret.get('token'))
  for (const k of KEYS) await put(k, await store.get(at(to, k)))
  await putSecret('token', await secret.get(at(to, 'token')))
  await secret.set('env', to)
  try { localStorage.setItem('env', to) } catch { /* restoreEnv reads the Keychain's pointer */ }
  for (const k of KEYS) await store.del(at(to, k))
  await secret.del(at(to, 'token'))
}

/** Whether the phone is still signed in to that env for the card's account (then switching needs no sign-in). main is the card's main account id. */
export async function signedInFor(e: string, main: string, mainOf: (id: string) => string) {
  const m = await store.get<{ accounts: { device: { accountId: string } | null }[] }>(at(e, 'member'))
  return !!await secret.get(at(e, 'token')) && !!m?.accounts.some(a => a.device && mainOf(a.device.accountId) === main)
}

/** Forget the sign-ins kept on the shelf (when signing out; a switch cut short can leave one for the current env too), and return their tokens so they can be ended on their servers. */
export async function dropShelved() {
  const out: { env: string, token: string }[] = []
  for (const e of new Set([START, 'demo'])) {
    const token = await secret.get(at(e, 'token'))
    if (token) out.push({ env: e, token })
    await secret.del(at(e, 'token'))
    for (const k of KEYS.filter(k => k !== 'dftAcct')) await store.del(at(e, k))
  }
  return out
}
