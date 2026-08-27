// Proxy endpoint for the grantor-name typeahead on /grants/new.
// Browser hits this with its JWT; we forward to PHP /cgpay-people-autocomplete
// using the shared secret and the sponsee's uid from the token claims.

import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { bearerFromRequest, verifyToken } from '$lib/server/auth'
import { autocompletePeople, PhpPeopleError } from '$lib/server/php-people'

function requireClaims(request: Request) {
  const token = bearerFromRequest(request)
  const claims = token ? verifyToken(token) : null
  if (!claims) throw error(401, 'unauthorized')
  return claims
}

export const GET: RequestHandler = async ({ request, url }) => {
  const claims = requireClaims(request)

  const q = (url.searchParams.get('q') ?? '').trim()
  if (q.length < 2) return json({ people: [] })

  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? 20)))

  try {
    const people = await autocompletePeople(claims.uid, q, limit)
    return json({ people })
  } catch (e) {
    if (e instanceof PhpPeopleError && e.status === 403) throw error(403, 'not a sponsored partner')
    console.error('[people-autocomplete] failed:', e)
    // Autocomplete is a UX enhancement - return empty so the form still works.
    return json({ people: [] })
  }
}
