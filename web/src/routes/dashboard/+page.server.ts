import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

// The real dashboard is the root page (/). This alias exists so people can
// share https://cgpay-poc.commongood.earth/dashboard and land in the right
// place, matching the PHP member site's /dashboard convention.
export const load: PageServerLoad = () => {
  redirect(302, '/')
}
