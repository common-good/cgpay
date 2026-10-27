// Signed-in members never see the welcome page - bounce them to the dashboard
// (which is still the index route). The whoami check runs in the layout, so
// re-read it here through the parent rather than hitting PHP twice.

import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { env } from '$env/dynamic/public'

export const load: PageServerLoad = async ({ parent }) => {
  const { user } = await parent()
  if (user) throw redirect(303, '/')
  return {
    phpBase: env.PUBLIC_PHP_BASE_URL ?? ''
  }
}
