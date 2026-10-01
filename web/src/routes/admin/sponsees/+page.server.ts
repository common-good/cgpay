import type { PageServerLoad } from './$types'
import { getSponseesList } from '$lib/server/admin-lists'

const PAGE_SIZE = 25

export const load: PageServerLoad = async ({ url, cookies }) => {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const offset = (page - 1) * PAGE_SIZE
  const data = await getSponseesList(cookies, { limit: PAGE_SIZE, offset })
  return { ...data, page, pageSize: PAGE_SIZE }
}
