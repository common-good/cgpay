import { appProxy } from '$lib/server/app-api'

// The photo of the account the app scanned (only with the card's code).
export const POST = appProxy('photo', ['token', 'actorId', 'otherId'])
