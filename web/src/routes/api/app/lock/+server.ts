import { appProxy } from '$lib/server/app-api'

// Make the app a company's cash register (account), stop (account 0), or end a manager's unlock (no account).
export const POST = appProxy('lock', ['token', 'account'])
