// Shared validators across the three /reset pages + the server-side proxies.
// Validation is intentionally minimal here: PHP owns the real identifier
// lookup (encrypted email, QID, phone, name) via /cgpay/lookup, and PHP's
// $a->oneTimePass() checks the code. The browser validation is only to catch
// obvious shape errors before a round trip.

export type FieldErrors = {
  identifier?: string
  channel?: string
  code?: string
  newPassword?: string
  confirmPassword?: string
}

export function validateIdentifier(value: string): string | null {
  const v = value.trim()
  if (v === '') return 'Please enter your account ID, email, or phone.'
  if (v.length > 254) return 'That identifier is too long.'
  return null
}

export function validateChannel(value: string): string | null {
  if (value !== 'email' && value !== 'sms') return 'Pick a channel for the code.'
  return null
}

export function validateCode(value: string): string | null {
  const v = value.trim()
  if (v === '') return 'Please enter the code we sent.'
  if (!/^[0-9]{4,10}$/.test(v)) return 'That code does not look right - check the email or text.'
  return null
}

export function validatePassword(value: string): string | null {
  if (!value) return 'Please choose a password.'
  if (value.length < 8) return 'Password must be at least 8 characters.'
  if (value.length > 128) return 'Password is too long.'
  return null
}

export function validateConfirmPassword(password: string, confirm: string): string | null {
  if (!confirm) return 'Please confirm your password.'
  if (password !== confirm) return 'Passwords do not match.'
  return null
}

export type ResetRequestInput = {
  identifier: string
  channel: 'email' | 'sms'
}

export function validateResetRequest(input: ResetRequestInput): FieldErrors {
  const errs: FieldErrors = {}
  const idErr = validateIdentifier(input.identifier)
  if (idErr) errs.identifier = idErr
  const chErr = validateChannel(input.channel)
  if (chErr) errs.channel = chErr
  return errs
}
