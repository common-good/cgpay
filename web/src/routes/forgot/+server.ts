import { redirect } from '@sveltejs/kit'
import { phpUrl } from '$lib/utils'

// "Forgot password" from the store app's bundled sign-in screen: today PHP's reset page (the same place the login page links to).
export const GET = () => { throw redirect(302, phpUrl('settings/password')) }
