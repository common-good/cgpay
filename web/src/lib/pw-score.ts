// Mirrors cgmembers-frame cgmembers/rcredits/js/scraps.js pwScore: 1 point for each of
// {unicode, uppercase, lowercase, digit, punctuation} present, plus length/7. The server is
// the final judge (u\okPass in cg-util.inc); this only drives the inline strength meter.

export const PW_MIN_SCORE = 5.14

export function pwScore(s: string): number {
  if (!s) return 0
  const hasUnicode = /[^\u0000-\u007f]/.test(s) ? 1 : 0
  const hasUpper = /[A-Z]/.test(s) ? 1 : 0
  const hasLower = /[a-z]/.test(s) ? 1 : 0
  const hasDigit = /[0-9]/.test(s) ? 1 : 0
  const hasPunc = /[^A-Za-z0-9]/.test(s) ? 1 : 0
  return hasUnicode + hasUpper + hasLower + hasDigit + hasPunc + s.length / 7
}

export function pwStrengthRatio(s: string): number {
  return Math.min(1, pwScore(s) / PW_MIN_SCORE)
}
