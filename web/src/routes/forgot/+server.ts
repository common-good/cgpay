import { redirect } from '@sveltejs/kit'

// "Forgot password" from the store app's bundled sign-in screen: the live site's reset flow, the same place the login page links to.
export const GET = () => { throw redirect(302, '/reset') }
