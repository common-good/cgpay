// Short-lived scratch state for the three-page reset flow:
//   /reset           -> captures the identifier + channel
//   /reset/verify    -> captures the 6-digit code
//   /reset/password  -> reads the whole thing, submits new password, clears
//
// sessionStorage is per-tab + per-origin and clears on tab close, which matches
// the "a reset is in progress on this device right now" lifetime we want.

const KEY = 'cg-reset'

export type ResetSession = {
  identifier: string
  channel: 'email' | 'sms'
  code?: string
}

export function writeResetSession(s: ResetSession): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // Private-browsing mode or a storage quota failure. The next page will
    // redirect back to /reset when readResetSession returns null.
  }
}

export function readResetSession(): ResetSession | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const s = parsed as Partial<ResetSession>
    if (typeof s.identifier !== 'string' || !s.identifier) return null
    if (s.channel !== 'email' && s.channel !== 'sms') return null
    return { identifier: s.identifier, channel: s.channel, code: typeof s.code === 'string' ? s.code : undefined }
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
