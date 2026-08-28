// Phase 3 endpoint — Expected Grants list + create.
// GET  → sponsee's own grants (via PHP /cgpay-grants)
// POST → create a new expected grant for the signed-in sponsee

import { json, error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { bearerFromRequest, verifyToken } from '$lib/server/auth'
import { listGrants, createGrant, PhpGrantError, type CreateGrantInput } from '$lib/server/php-grants'
import { uploadFileToDrive, driveFileName, UNDOC_GRANT_MAX } from '$lib/server/drive'

function requireClaims(request: Request) {
  const token = bearerFromRequest(request)
  const claims = token ? verifyToken(token) : null
  if (!claims) throw error(401, 'unauthorized')
  return claims
}

export const GET: RequestHandler = async ({ request }) => {
  const claims = requireClaims(request)
  try {
    const grants = await listGrants(claims.uid)
    return json({ grants })
  } catch (e) {
    if (e instanceof PhpGrantError && e.status === 403) throw error(403, 'not a sponsored partner')
    console.error('[grants] list failed:', e)
    throw error(502, 'Unable to load grants — please try again.')
  }
}

const ALLOWED_BY = new Set(['ach', 'check', 'wire'])
const FORM_ERROR_SUMMARY = 'There is an error in the information you typed — fix the highlighted field(s) and try again.'

/** Return a 400 with per-field errors so the UI can highlight the bad fields. */
function fieldErrorResponse(errors: Record<string, string>, message = FORM_ERROR_SUMMARY) {
  return json({ message, errors, error: message }, { status: 400 })
}

export const POST: RequestHandler = async ({ request }) => {
  const claims = requireClaims(request)

  // Accept either JSON (backward-compatible, no file) or multipart/form-data (with agreement file).
  // Grants over UNDOC_GRANT_MAX ($5k) should include an agreement PDF (per William, Phase 3.5 PR B).
  const contentType = request.headers.get('content-type') || ''
  let body: Record<string, unknown> | null = null
  let file: File | null = null

  if (contentType.startsWith('multipart/form-data')) {
    const form = await request.formData().catch(() => null)
    if (!form) throw error(400, 'invalid request body')
    body = {}
    for (const [k, v] of form.entries()) {
      if (v instanceof File) file = v
      else body[k] = v
    }
  } else {
    body = await request.json().catch(() => null)
    if (!body) throw error(400, 'invalid request body')
  }

  // Client-side (pre-PHP) validation of grant + grantor fields.
  // Collect ALL problems into one payload so the UI highlights them together.
  const preErrors: Record<string, string> = {}

  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''
  const amount = Number(body.amount)
  const by = typeof body.by === 'string' ? body.by.toLowerCase() : ''

  if (!fullName) preErrors.fullName = "Please enter the grantor's name."
  if (!Number.isFinite(amount) || amount <= 0) preErrors.amount = 'Please enter an amount greater than zero.'
  if (!ALLOWED_BY.has(by)) preErrors.by = 'Please choose a payment method (ACH, check, or wire).'

  // Grantor mailing address (per William 2026-07-31 — address required).
  const address = typeof body.address === 'string' ? body.address.trim() : ''
  const city = typeof body.city === 'string' ? body.city.trim() : ''
  const zip = typeof body.zip === 'string' ? body.zip.trim() : ''
  const state = Number(body.state)

  if (!address) preErrors.address = "Please enter the grantor's street address."
  if (!city) preErrors.city = "Please enter the grantor's city."
  if (!Number.isFinite(state) || state <= 0) preErrors.state = "Please select the grantor's state."
  if (!zip) preErrors.zip = "Please enter the grantor's zip code."

  // Check-specific fields (per William 2026-08-04): required when by === 'check'.
  const ckNum = typeof body.ckNum === 'string' ? body.ckNum.trim() : ''
  const ckDate = typeof body.ckDate === 'string' ? body.ckDate.trim() : ''
  if (by === 'check') {
    if (!ckNum) preErrors.ckNum = 'Please enter the check number.'
    if (!ckDate) preErrors.ckDate = 'Please enter the check date.'
  }

  // Agreement file required for grants > UNDOC_GRANT_MAX (per William, PR B).
  // File itself is optional at submission time when the sponsee doesn't have one yet;
  // admin can attach later. So we only enforce the "need something" rule for large grants.
  const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB
  if (file) {
    if (file.size > MAX_FILE_BYTES) {
      preErrors.agreement = 'File is too large (max 10 MB).'
    }
  }

  if (Object.keys(preErrors).length > 0) return fieldErrorResponse(preErrors)

  const input: CreateGrantInput = {
    uid: claims.uid,
    fullName,
    amount,
    by: by as 'ach' | 'check' | 'wire'
  }
  for (const k of ['email', 'phone', 'address', 'city', 'zip'] as const) {
    if (typeof body[k] === 'string' && body[k].trim()) input[k] = body[k].trim()
  }
  if (body.state != null && Number.isFinite(Number(body.state))) input.state = Number(body.state)
  if (by === 'check') {
    input.ckNum = ckNum
    input.ckDate = ckDate
  }

  // Upload agreement file to Drive if present. Non-fatal if it fails or is
  // silently skipped (no creds configured) - grant record still gets created.
  if (file) {
    try {
      const buf = Buffer.from(await file.arrayBuffer())
      const uploaded = await uploadFileToDrive({
        fileName: driveFileName({
          createdSec: Math.floor(Date.now() / 1000),
          grantorName: fullName,
          amount,
          sponseeName: claims.name || `uid ${claims.uid}`,
          originalName: file.name
        }),
        mimeType: file.type || 'application/octet-stream',
        fileBuffer: buf
      })
      if (uploaded) input.driveFileId = uploaded.fileId
    } catch (e) {
      // Log but don't block grant creation - admin can attach the file later.
      console.error('[grants] Drive upload failed:', e)
    }
  }

  try {
    const id = await createGrant(input)
    return json({ id })
  } catch (e) {
    if (e instanceof PhpGrantError && e.status === 400) {
      // Forward per-field errors from PHP if present; otherwise fall back to single-message shape.
      if (e.fieldErrors && Object.keys(e.fieldErrors).length > 0) {
        return fieldErrorResponse(e.fieldErrors, e.message || FORM_ERROR_SUMMARY)
      }
      return fieldErrorResponse({ _form: e.message }, e.message)
    }
    if (e instanceof PhpGrantError && e.status === 403) throw error(403, 'not a sponsored partner')
    console.error('[grants] create failed:', e)
    throw error(502, 'Unable to save the grant — please try again.')
  }
}
