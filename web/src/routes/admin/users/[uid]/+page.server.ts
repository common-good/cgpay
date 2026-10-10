import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { getAdminUser } from '$lib/server/admin-user'
import { runAdminUserAction, type UserAction } from '$lib/server/admin-user-action'

export const load: PageServerLoad = async ({ params, cookies }) => {
  const uid = Number(params.uid)
  if (!Number.isInteger(uid) || uid <= 0) throw error(400, 'Invalid user id.')

  const detail = await getAdminUser(cookies, uid)
  if (!detail) throw error(404, 'User not found.')

  return detail
}

export const actions: Actions = {
  action: async ({ request, params, cookies }) => {
    const uid = Number(params.uid)
    if (!Number.isInteger(uid) || uid <= 0) throw error(400, 'Invalid user id.')

    const form = await request.formData()
    const raw = form.get('action')
    if (raw !== 'activate' && raw !== 'deactivate') {
      return fail(400, { actionMessage: 'Unknown action.' })
    }
    const action = raw as UserAction

    const result = await runAdminUserAction(cookies, uid, action)
    if (!result.ok) {
      return fail(result.status, { actionMessage: result.message })
    }
    return {
      actionMessage: result.noop
        ? `No change - account was already ${action === 'activate' ? 'active' : 'inactive'}.`
        : `Account ${action === 'activate' ? 'activated' : 'deactivated'}.`
    }
  }
}
