import { appProxy } from '$lib/server/app-api'

// Sign-in by a scanned card, when the app switches to or from demo: PHP answers with a token or an MFA handle, as for signin.
export const POST = appProxy('card', ['qr', 'password', 'skipMfa', 'label', 'deviceKey'], true)
