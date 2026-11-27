import { appProxy } from '$lib/server/app-api'

// The device credentials for a token (the app refreshes them when it opens).
export const POST = appProxy('device', ['token'])
