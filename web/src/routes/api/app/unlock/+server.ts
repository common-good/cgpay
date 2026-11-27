import { appProxy } from '$lib/server/app-api'

// The password again, before the app changes account or settings (when its settings ask for that), or a manager's card to unlock a cash register. Counts like a sign-in attempt.
export const POST = appProxy('unlock', ['token', 'password', 'qr'], true)
