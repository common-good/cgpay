import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { currentUser } from '$lib/server/auth'

// Feedback: a message to Common Good from a signed-in member. The store app has a screen of its own, which also sends the app's log.
export const load: PageServerLoad = async ({ cookies }) => { if (!await currentUser(cookies)) redirect(303, '/login') }
