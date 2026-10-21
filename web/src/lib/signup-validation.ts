// Pure validators for the sign-up form. Shape matches the fields PHP
// `/cgpay-signup` will expect once that endpoint lands (see the bank-transfers
// scoping doc's sibling: node signup redesign). Format-only checks live here
// so submit-time UX stays responsive; final uniqueness, criminal-name and
// anti-abuse checks stay on the PHP side.

export type SignupInput = {
  fullName: string
  email: string
  phone: string
  zip: string
  country?: number
  agreementAccepted: boolean
}

export type FieldErrors = Partial<Record<keyof SignupInput, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const US_ZIP_RE = /^\d{5}(-\d{4})?$/

export function validateFullName(v: string): string | null {
  const name = v.trim()
  if (!name) return 'Please enter your full name.'
  if (name.length < 2) return 'That name looks too short.'
  if (!/\s/.test(name)) return 'Please enter your first and last name.'
  return null
}

export function validateEmail(v: string): string | null {
  const email = v.trim()
  if (!email) return 'Please enter your email address.'
  if (!EMAIL_RE.test(email)) return 'That is not a valid email address.'
  return null
}

export function validatePhone(v: string): string | null {
  const digits = v.replace(/\D/g, '')
  if (!digits) return 'Please enter your phone number.'
  if (digits.length < 10) return 'Please enter a 10-digit phone number.'
  return null
}

export function validateZip(v: string, isUS: boolean = true): string | null {
  const zip = v.trim()
  if (!zip) return 'Please enter your ZIP code.'
  if (isUS && !US_ZIP_RE.test(zip)) return 'That is not a valid US ZIP code.'
  return null
}

export function validateAgreement(accepted: boolean): string | null {
  return accepted ? null : 'You must agree to continue.'
}

/** Run every validator; returns {} when the form is clean. */
export function validateSignup(input: SignupInput, isUS: boolean = true): FieldErrors {
  const errors: FieldErrors = {}
  const fullName = validateFullName(input.fullName)
  if (fullName) errors.fullName = fullName
  const email = validateEmail(input.email)
  if (email) errors.email = email
  const phone = validatePhone(input.phone)
  if (phone) errors.phone = phone
  const zip = validateZip(input.zip, isUS)
  if (zip) errors.zip = zip
  const agreement = validateAgreement(input.agreementAccepted)
  if (agreement) errors.agreementAccepted = agreement
  return errors
}
