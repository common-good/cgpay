import { appProxy } from '$lib/server/app-api'

// What the app shows about the account it scanned (name, location, limit), for the account the app acts as.
export const POST = appProxy('identity', ['token', 'actorId', 'otherId'])
