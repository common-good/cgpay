import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { phpUrl } from '$lib/utils'

// Feedback goes to the member site's message form for the administrators (its general help page), until node has a form of its own.
// The store app reaches it through /app-enter, which opens only paths on this site.
export const load: PageServerLoad = () => { redirect(303, phpUrl('help')) }
