// Shared reactive user state: token + menu + info the header renders.
// Written by /login (after successful sign-in) and by +layout.svelte
// (from localStorage + /api/me/info on page load). Read by +layout.svelte
// so the header re-renders across SPA navigations without a hard refresh.

const TOKEN_KEY = 'cg_token'
const MENU_KEY = 'cg_menu'

export type UserInfo = { name?: string; sponsored?: boolean } | null

function safeGet(key: string): string | null {
  try { return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null }
  catch { return null }
}
function safeSet(key: string, value: string): void {
  try { localStorage.setItem(key, value) } catch { /* private mode / blocked - keep in-memory */ }
}
function safeRemove(key: string): void {
  try { localStorage.removeItem(key) } catch { /* same */ }
}

function readStoredMenu(): string[] | null {
  const raw = safeGet(MENU_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.every((s) => typeof s === 'string')) return parsed
  } catch { /* ignore */ }
  return null
}

export const userState = $state({
  token: safeGet(TOKEN_KEY),
  menu: readStoredMenu() ?? ['Dashboard', 'History', 'Community', 'Settings'],
  info: null as UserInfo
})

export function setSession(token: string, menu?: string[]): void {
  userState.token = token
  safeSet(TOKEN_KEY, token)
  if (Array.isArray(menu)) {
    userState.menu = menu
    safeSet(MENU_KEY, JSON.stringify(menu))
  }
}

export function setInfo(info: UserInfo): void {
  userState.info = info
}

export function clearSession(): void {
  userState.token = null
  userState.info = null
  safeRemove(TOKEN_KEY)
  safeRemove(MENU_KEY)
}
