import { json } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'

// The oldest store build the server still accepts (APP_MIN_VERSION, a dotted version like 1.2; unset: any), and where each store offers the app.
// An older build asks the member to update (see the app's update.ts). time: the server's clock, for the app's clock check (see clock.ts).
const ANDROID = 'https://play.google.com/store/apps/details?id=earth.commongood.cgpay'

export const POST = () => json({ time: Date.now(), min: env.APP_MIN_VERSION ?? '', store: { android: ANDROID, ios: env.APP_IOS_STORE_URL ?? '' } }, { headers: { 'Cache-Control': 'no-store' } })
