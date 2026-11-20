// QR code formats, ported from the legacy app's utils.js: <fmt><region><acct><agent><cardCode>, where the format character says how long each part is.
const DIG36 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const REGION_LENS = '111111112222222233333333333344444444'
const ACCT_LENS = '222233332222333322223333444444445555'
const AGENT_LENS = '012301230123012301230123012301230123'
const MAIN_LENS = '.12.13.22.23.32.33.34.44.45' // region and acct lengths without the agent
const QR_REGEX = /^HTTP:\/\/[0-9A-Za-z]{1,4}\.RC[24]\.ME\/[0-9A-Z]{2,5}[0-9A-Za-z]{0,25}$/
const TEST_QR_START = 'HTTP://6VM.RC4.ME/'

export type Card = { acct: string, main: string, code: string }

const f = (id: string) => DIG36.indexOf(id[0])

/** Just the format, region and account parts of an account id (no agent, no card code). */
export function mainId(id: string) {
  const i = f(id)
  return DIG36[4 * MAIN_LENS.indexOf('.' + REGION_LENS[i] + ACCT_LENS[i]) / 3] + id.substring(1, 1 + +REGION_LENS[i] + +ACCT_LENS[i])
}

/** The account id without its card code. */
export const noCardCode = (id: string) => id.substr(0, 1 + +REGION_LENS[f(id)] + +ACCT_LENS[f(id)] + +AGENT_LENS[f(id)])

/** The QR code address for an account (main id), as another member's scanner expects it. */
export function qrUrl(id: string, real: boolean) {
  const i = f(id), regLen = +REGION_LENS[i]
  return `HTTP://${id.substring(1, 1 + regLen)}.${real ? 'RC2.ME' : 'RC4.ME'}/${id[0]}${id.substring(1 + regLen)}`
}

/** Split a scanned QR code into account and card code. Throws an Error whose message is for the member. */
export function parseQr(qr: string, real: boolean): Card {
  qr = qr.replace(/^[^/]*\/\/[^/]*\//, s => s.toUpperCase()) // a scanner may hand over the address part in lowercase; the card code after it is case-sensitive
  if (!QR_REGEX.test(qr)) throw new Error('That is not a valid Common Good QR Code format.')
  const parts = qr.split(/[\/.]/)
  const acct = parts[5][0] + parts[2] + parts[5].substring(1)
  const testing = qr.startsWith(TEST_QR_START)
  if (testing && real) throw new Error('That is a CGPay test QR Code and cannot be used in production mode.')
  if (!testing && !real) throw new Error('That is a real Common Good QR Code and cannot be used in test mode.')
  const main = mainId(acct)
  const acct0 = acct.substring(0, main.length + +AGENT_LENS[f(acct)])
  return { acct: acct0, main, code: acct.substring(acct0.length) }
}
