import { appProxy } from '$lib/server/app-api'

// The app's demo sign-in ("demo" and "pass" on its sign-in screen): PHP makes a fresh demo account and answers with its token. Only the demo server does.
export const POST = appProxy('demo', ['label', 'deviceKey'], true)
