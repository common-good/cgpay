import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { getAdminSponsee } from '$lib/server/admin-sponsee'

export const load: PageServerLoad = async ({ params, cookies }) => {
  const uid = Number(params.uid)
  if (!Number.isInteger(uid) || uid <= 0) throw error(400, 'Invalid sponsee id.')

  const detail = await getAdminSponsee(cookies, uid)
  if (!detail) throw error(404, 'Sponsee not found.')

  return detail
}
