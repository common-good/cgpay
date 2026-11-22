import { appProxy } from '$lib/server/app-api'

// A transaction (or its undo) from the app, sent now or from the queue of ones made offline; the proof is the old transaction API's.
export const POST = appProxy('tx', ['token', 'actorId', 'otherId', 'amount', 'description', 'created', 'proof', 'offline', 'pending', 'tip'])
