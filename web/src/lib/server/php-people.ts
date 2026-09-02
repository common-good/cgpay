// Server-to-server client for the PHP /cgpay-people-autocomplete endpoint.
// Auth: X-CG-Internal-Token: <PHP_SSO_SECRET> — same shared secret used by
// /cgpay-sso, /cgpay-lookup, /cgpay-grants (see cgmembers/rcredits/forms/cgpaypeople.inc).
//
// Used by /api/people-autocomplete (proxied from the browser) to power the
// grantor-name typeahead on /grants/new — filtering the people table to prior
// grantors, with prior donors to the current sponsee ranked first.

import { env } from '$env/dynamic/private'

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

function config() {
  const url = env.PHP_GRANTS_URL
  const secret = env.PHP_SSO_SECRET
  if (!url || !secret) throw new Error('PHP_GRANTS_URL / PHP_SSO_SECRET not configured')
  // Derive /cgpay-people-autocomplete from PHP_GRANTS_URL by swapping the pathname.
  let peopleUrl: string
  try {
    const u = new URL(url)
    u.pathname = '/cgpay-people-autocomplete'
    peopleUrl = u.toString()
  } catch {
    throw new Error('PHP_GRANTS_URL is not a valid URL')
  }
  return { peopleUrl, secret }
}

export async function autocompletePeople(uid: number, query: string, limit = 20): Promise<PersonSuggestion[]> {
  const { peopleUrl, secret } = config()
  const params = new URLSearchParams({
    uid: String(uid),
    q: query,
    limit: String(limit)
  })
  const url = peopleUrl + (peopleUrl.includes('?') ? '&' : '?') + params.toString()
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'x-cg-internal-token': secret }
  })
  if (res.status === 403) throw new PhpPeopleError('not a sponsored partner', 403)
  if (!res.ok) throw new PhpPeopleError(`PHP autocomplete returned ${res.status}`, res.status)
  const data = await res.json()
  if (!Array.isArray(data?.people)) throw new Error('PHP autocomplete: unexpected body')
  return data.people as PersonSuggestion[]
}

export class PhpPeopleError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'PhpPeopleError'
    this.status = status
  }
}
