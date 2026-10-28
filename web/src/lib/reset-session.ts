// Short-lived scratch state for the three-page reset flow:
//   /reset           -> captures the identifier + channel, writes {uid, qid}
//   /reset/verify    -> captures the code, writes it alongside {uid, qid}
//   /reset/password  -> reads the whole thing, submits new password, clears
//
// sessionStorage is per-tab + per-origin and clears on tab close, which matches
// the "a reset is in progress on this device right now" lifetime we want.
// Server-side pages re-render as anonymous without this (SvelteKit does not
// touch sessionStorage), and that's fine - the reset flow is anonymous by
// design.

const KEY = 'cg-reset'

export type ResetSession = {
  uid: number
  qid: string
  channel: 'email' | 'sms'
  code?: string
}

export function writeResetSession(s: ResetSession): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // Private-browsing mode or a storage quota failure. The user can retry;
    // the next page will redirect them back to /reset when readResetSession
    // returns null.
  }
}

export function readResetSession(): ResetSession | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const s = parsed as Partial<ResetSession>
    if (typeof s.uid !== 'number' || typeof s.qid !== 'string') return null
    if (s.channel !== 'email' && s.channel !== 'sms') return null
    return { uid: s.uid, qid: s.qid, channel: s.channel, code: typeof s.code === 'string' ? s.code : undefined }
  } catch {
    return null
  }
}

export function clearResetSession(): void {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // best effort
  }
}
