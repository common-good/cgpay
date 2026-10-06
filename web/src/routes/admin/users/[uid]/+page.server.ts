import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { getAdminUser } from '$lib/server/admin-user'

export const load: PageServerLoad = async ({ params, cookies }) => {
  const uid = Number(params.uid)
  if (!Number.isInteger(uid) || uid <= 0) throw error(400, 'Invalid user id.')

  const detail = await getAdminUser(cookies, uid)
  if (!detail) throw error(404, 'User not found.')

  return detail
}
