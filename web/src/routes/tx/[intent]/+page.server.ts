import { error, redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { phpUrl } from '$lib/utils'

// Typing a payment or charge is the member site's page, until node has one of its own.
// The store app reaches it through /app-enter (signed in from its token), which opens only paths on this site.
export const load: PageServerLoad = ({ params }) => {
  if (!['pay', 'charge'].includes(params.intent)) error(404, 'Not found')
  redirect(303, phpUrl(`tx/${params.intent}`))
}
