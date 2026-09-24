// Require a signed-in user for the /grants subtree.
// Pages inside /grants only call authenticated APIs; /grants/new in particular
// has no mount-time fetch, so an anonymous visitor would otherwise see an empty
// form. Enforce the redirect at the server layer instead.

import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ parent }) => {
  const { user } = await parent()
  if (!user) throw redirect(302, '/login')
  return { user }
}
