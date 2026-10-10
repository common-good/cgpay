import type { PageServerLoad } from './$types'
import { getMembersList } from '$lib/server/admin-lists'

const PAGE_SIZE = 25

export const load: PageServerLoad = async ({ url, cookies }) => {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1))
  const q = (url.searchParams.get('q') ?? '').trim()
  const offset = (page - 1) * PAGE_SIZE
  const data = await getMembersList(cookies, { limit: PAGE_SIZE, offset, q })
  return { ...data, page, q, pageSize: PAGE_SIZE }
}
