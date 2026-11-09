// Scratch state the signup flow passes between pages (uid from the signup response,
// code the user types on the verify page) via sessionStorage. Per-tab, cleared when
// the tab closes, so leaving the flow abandons the state cleanly.

const KEY = 'cgpay.signup'

export type SignupSession = { uid: number; qid: string; code?: string }

export function readSignupSession(): SignupSession | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed?.uid !== 'number' || typeof parsed?.qid !== 'string') return null
    return parsed as SignupSession
  } catch {
    return null
  }
}

export function writeSignupSession(data: SignupSession): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(KEY, JSON.stringify(data))
}

export function clearSignupSession(): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(KEY)
}
