import type { PageServerLoad } from './$types'
import { getAdminOverview } from '$lib/server/admin-stats'

export const load: PageServerLoad = async ({ cookies }) => {
  const overview = await getAdminOverview(cookies)
  return { overview }
}
