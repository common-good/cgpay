import { appProxy } from '$lib/server/app-api'

// Sign out: end this token (or, with everywhere, all the member's devices).
export const POST = appProxy('revoke', ['token', 'everywhere'])
