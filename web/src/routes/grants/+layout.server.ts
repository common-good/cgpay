// Require a signed-in user for the /grants subtree.
// Pages inside /grants only call authenticated APIs; /grants/new in particular
// has no mount-time fetch, so an anonymous visitor would otherwise see an empty
// form. Enforce the redirect at the server layer instead.

import { redirect } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'
import type { LayoutServerLoad } from './$types'

// E2E-only escape hatch: env-gated + explicit cookie required.
// Lets grants.spec.ts render the form without needing a live PHP backend for
// whoami. Production leaves E2E_FAKE_USER unset, so this branch never fires.
function fakeE2EUser(cookieValue: string | undefined) {
  if (env.E2E_FAKE_USER !== '1' || cookieValue !== 'sponsee') return null
  return { uid: 999, name: 'Test Sponsee', sponsored: true, menu: ['Dashboard'] }
}

export const load: LayoutServerLoad = async ({ parent, cookies }) => {
  const { user } = await parent()
  const resolved = user ?? fakeE2EUser(cookies.get('e2e-fake-user'))
  if (!resolved) throw redirect(302, '/login')
  return { user: resolved }
}
