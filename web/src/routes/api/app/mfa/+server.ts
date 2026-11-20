import { appProxy } from '$lib/server/app-api'

// Step 2: the emailed passcode (and whether to trust this device) turns the MFA handle into a token.
export const POST = appProxy('mfa', ['mfa', 'code', 'trust'], true)
