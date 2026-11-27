import { appProxy } from '$lib/server/app-api'

// Step 1 of the store app's sign-in: the app sends the identifier and password; PHP answers with a token or an MFA handle.
export const POST = appProxy('signin', ['identifier', 'password', 'label', 'deviceKey'], true)
