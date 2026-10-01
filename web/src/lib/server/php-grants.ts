// Server-to-server client for the PHP /cgpay-grants endpoint.
// Uses `callPhp` for URL resolution, shared-secret injection, and error shaping;
// see cgmembers/rcredits/forms/cgpaygrants.inc for the PHP side.
//
// `callPhp` throws `PhpCallError` for config/network/malformed-body failures.
// We let those propagate to the /api handler, which logs + returns 502.
// HTTP errors from PHP itself surface as `{ok:false, status, body}` and get
// translated into a `PhpGrantError` so the caller can pattern-match on status.

import { callPhp } from './php-client'

export type GrantSummary = {
  id: number
  amount: number
  by: 'ach' | 'check' | 'wire'
  grantor: string
  documented: number | null
  received: number | null
  created: number
}

export type CreateGrantInput = {
  uid: number
  amount: number
  by: 'ach' | 'check' | 'wire'
  fullName: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: number
  zip?: string
  ckNum?: string   // required when by === 'check'
  ckDate?: string  // required when by === 'check'; ISO date string or anything strtotime-parseable
  driveFileId?: string // Google Drive file id for the grant agreement PDF (PR B)
  grantorPid?: number  // when the user picks an existing grantor from the autocomplete
}

export async function listGrants(uid: number): Promise<GrantSummary[]> {
  const result = await callPhp<{ grants: unknown }>('/cgpay-grants', {
    baseUrlEnv: 'PHP_GRANTS_URL',
    method: 'GET',
    query: { uid }
  })
  if (!result.ok) throw new PhpGrantError(`PHP /cgpay-grants list returned ${result.status}`, result.status)
  if (!Array.isArray(result.data.grants)) throw new Error('PHP /cgpay-grants list: unexpected body')
  return result.data.grants as GrantSummary[]
}

type CreateGrantResponse = {
  id?: number
  message?: string
  error?: string
  errors?: Record<string, string>
}

export async function createGrant(input: CreateGrantInput): Promise<number> {
  const result = await callPhp<CreateGrantResponse>('/cgpay-grants', {
    baseUrlEnv: 'PHP_GRANTS_URL',
    method: 'POST',
    body: input
  })

  if (!result.ok) {
    // PHP returns { message, errors: { fieldName: "message", ... }, error } - see cgpaygrants.inc
    const body = result.body as CreateGrantResponse | null
    const msg = (body && typeof body.message === 'string') ? body.message
             : (body && typeof body.error === 'string') ? body.error
             : `PHP /cgpay-grants create returned ${result.status}`
    const fieldErrors = (body && body.errors && typeof body.errors === 'object')
      ? body.errors as Record<string, string>
      : undefined
    throw new PhpGrantError(msg, result.status, fieldErrors)
  }

  if (typeof result.data.id !== 'number') throw new Error('PHP /cgpay-grants create: unexpected body')
  return result.data.id
}

export class PhpGrantError extends Error {
  status: number
  fieldErrors?: Record<string, string>
  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message)
    this.name = 'PhpGrantError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}
