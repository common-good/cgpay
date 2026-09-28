// Require admin access for the /admin subtree.
// PHP's cgpay-whoami includes 'Admin' in the menu for accounts with B_ADMIN;
// see cgmembers/rcredits/forms/cgpaywhoami.inc.

import { redirect, error } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ parent }) => {
  const { user } = await parent()
  if (!user) throw redirect(302, '/login')
  if (!user.menu.includes('Admin')) throw error(403, 'Admin access required.')
  return { user }
}
