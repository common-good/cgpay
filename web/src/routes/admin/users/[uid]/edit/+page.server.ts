import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { getAdminUser } from '$lib/server/admin-user'
import { updateAdminUser, type UserUpdateFields } from '$lib/server/admin-user-update'

const EDITABLE_FIELDS = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'zip'] as const

export const load: PageServerLoad = async ({ params, cookies }) => {
  const uid = Number(params.uid)
  if (!Number.isInteger(uid) || uid <= 0) throw error(400, 'Invalid user id.')
  const detail = await getAdminUser(cookies, uid)
  if (!detail) throw error(404, 'User not found.')
  return { user: detail.user }
}

export const actions: Actions = {
  default: async ({ request, params, cookies }) => {
    const uid = Number(params.uid)
    if (!Number.isInteger(uid) || uid <= 0) throw error(400, 'Invalid user id.')

    const form = await request.formData()
    const fields: UserUpdateFields = {}
    const values: Record<string, string> = {}
    for (const k of EDITABLE_FIELDS) {
      const v = form.get(k)
      if (typeof v === 'string') {
        fields[k] = v.trim()
        values[k] = v
      }
    }

    const result = await updateAdminUser(cookies, uid, fields)
    if (!result.ok) {
      return fail(result.status, {
        values,
        message: result.message,
        errors: result.fieldErrors ?? {}
      })
    }

    // On success, bounce back to the user detail page so the fresh server-load
    // picks up the new values. Flash the updated field list via query param.
    const updatedParam = result.updated.length ? '?updated=' + encodeURIComponent(result.updated.join(',')) : ''
    throw redirect(303, `/admin/users/${uid}${updatedParam}`)
  }
}
