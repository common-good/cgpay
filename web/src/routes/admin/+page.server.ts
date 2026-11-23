import type { PageServerLoad } from './$types'
import { getAdminOverview } from '$lib/server/admin-stats'

export const load: PageServerLoad = async () => {
  const overview = await getAdminOverview()
  return { overview }
}
