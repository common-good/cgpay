import { appProxy } from '$lib/server/app-api'

// An admin types an account to act for (one not in their list): its device credentials, if PHP allows it.
export const POST = appProxy('account', ['token', 'who'])
