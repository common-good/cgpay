// The accounts the signed-in member may act for, kept on the phone so choosing one works offline.
// 'device' in the store is always the chosen account's credentials (the transaction screens read only that).
import type { Device } from '$lib/app-shell'
import { store } from '../storage'

export type Account = { uid: number, name: string, isCo: boolean, photo: string | null, device: Device | null }
export type Member = { uid: number, admin: boolean, accounts: Account[], lockedTo?: number } // lockedTo: the company a locked cash register's token works for

export const member = () => store.get<Member>('member')
export const dftAcct = () => store.get<number>('dftAcct') // survives sign-out: the account that comes up after signing in on this phone

/** The chosen account (or the member's own, if none is chosen or the chosen one is gone). */
export async function current(): Promise<Account | null> {
  const m = await member(), uid = await store.get<number>('acct')
  return m?.accounts.find(a => a.uid === uid) ?? m?.accounts.find(a => a.uid === m.uid) ?? m?.accounts[0] ?? null
}

/** Act for this account on this phone (dft: also make it the one that comes up after signing in here). */
export async function choose(a: Account, dft = false) {
  await store.set('acct', a.uid)
  if (dft) await store.set('dftAcct', a.uid)
  if (a.device) await store.set('device', a.device); else await store.del('device')
}

/**
 * Keep the member's accounts (from a sign-in or a refresh) and choose one: the one chosen before if it is still there,
 * else (after a sign-in) the phone's default, else their own. An account an admin typed stays in the list until sign-out.
 */
export async function keepMember(m: Member, signingIn = false) {
  const old = await member(), typed = old && old.uid === m.uid ? old.accounts.filter(a => !m.accounts.some(b => b.uid === a.uid) && a.uid !== m.uid) : []
  m = { ...m, accounts: [...m.accounts, ...typed] }
  await store.set('member', m)
  const want = signingIn ? await dftAcct() : await store.get<number>('acct') // read last, so a choice made meanwhile is kept
  const a = m.accounts.find(a => a.uid === want) ?? m.accounts.find(a => a.uid === m.uid) ?? m.accounts[0]
  if (a) await choose(a)
}

/** Add an account an admin typed, and choose it. */
export async function addTyped(a: Account, dft = false) {
  const m = await member()
  if (m && !m.accounts.some(b => b.uid === a.uid)) await store.set('member', { ...m, accounts: [...m.accounts, a] })
  await choose(a, dft)
}

export async function forget() { for (const k of ['member', 'acct', 'device']) await store.del(k) }
