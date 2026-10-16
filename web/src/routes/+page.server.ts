import { env } from '$env/dynamic/private'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = () => ({
  cgpayPwaUrl: env.CGPAY_PWA_URL ?? ''
})
