// Server-to-server client for the PHP /cgpay-grants endpoint.
// Uses `callPhp` for URL resolution, shared-secret injection, and error shaping;
// see cgmembers/rcredits/forms/cgpaygrants.inc for the PHP side.

import { callPhp, describeFailure } from './php-client'

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
  if (!result.ok) {
    if (result.kind === 'http') throw new PhpGrantError(`PHP /cgpay-grants list returned ${result.status}`, result.status)
    throw new Error(`PHP /cgpay-grants list: ${describeFailure(result.kind)}`)
  }
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
    if (result.kind === 'http') {
      // PHP now returns { message, errors: { fieldName: "message", ... }, error } - see cgpaygrants.inc
      const body = result.body as CreateGrantResponse | null
      const msg = (body && typeof body.message === 'string') ? body.message
               : (body && typeof body.error === 'string') ? body.error
               : `PHP /cgpay-grants create returned ${result.status}`
      const fieldErrors = (body && body.errors && typeof body.errors === 'object')
        ? body.errors as Record<string, string>
        : undefined
      throw new PhpGrantError(msg, result.status, fieldErrors)
    }
    throw new Error(`PHP /cgpay-grants create: ${describeFailure(result.kind)}`)
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
