import { appProxy } from '$lib/server/app-api'

// The password again, before the app changes account or settings (when its settings ask for that). Counts like a sign-in attempt.
export const POST = appProxy('unlock', ['token', 'password'], true)
