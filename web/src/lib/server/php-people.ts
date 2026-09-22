// Server-to-server client for the PHP /cgpay-people-autocomplete endpoint.
// Uses `callPhp` for URL resolution, shared-secret injection, and error shaping.
//
// Used by /api/people-autocomplete (proxied from the browser) to power the
// grantor-name typeahead on /grants/new - filtering the people table to prior
// grantors, with prior donors to the current sponsee ranked first.

import { callPhp } from './php-client'

export type PersonSuggestion = {
  pid: number
  fullName: string
  email: string
  phone: string
  address: string
  city: string
  state: number | null
  zip: string
}

export async function autocompletePeople(uid: number, query: string, limit = 20): Promise<PersonSuggestion[]> {
  const result = await callPhp<{ people: unknown }>('/cgpay-people-autocomplete', {
    baseUrlEnv: 'PHP_GRANTS_URL',
    method: 'GET',
    query: { uid, q: query, limit }
  })

  if (!result.ok) {
    if (result.status === 403) throw new PhpPeopleError('not a sponsored partner', 403)
    throw new PhpPeopleError(`PHP autocomplete returned ${result.status}`, result.status)
  }

  if (!Array.isArray(result.data.people)) throw new Error('PHP autocomplete: unexpected body')
  return result.data.people as PersonSuggestion[]
}

export class PhpPeopleError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'PhpPeopleError'
    this.status = status
  }
}
