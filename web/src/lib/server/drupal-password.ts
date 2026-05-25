// Port of Drupal 7's user_check_password / _password_crypt from cgmembers/includes/password.inc.
// Supports the $S$ (sha512), $P$ (md5 phpass), and $H$ (phpBB3-style md5) prefixes that Drupal
// produces and accepts. Used to verify passwords against the existing users.pass column without
// requiring members to reset.

import { createHash } from 'node:crypto'

const ITOA64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

// Custom base64 used by phpass — alphabet above, encoded in 6-bit chunks little-endian.
// Direct port of _password_base64_encode().
function passwordBase64Encode(input: Buffer, count: number): string {
  let output = ''
  let i = 0
  do {
    let value = input[i++]
    output += ITOA64[value & 0x3f]
    if (i < count) value |= input[i] << 8
    output += ITOA64[(value >> 6) & 0x3f]
    if (i++ >= count) break
    if (i < count) value |= input[i] << 16
    output += ITOA64[(value >> 12) & 0x3f]
    if (i++ >= count) break
    output += ITOA64[(value >> 18) & 0x3f]
  } while (i < count)
  return output
}

function passwordCrypt(algo: 'sha512' | 'md5', password: string, setting: string): string | null {
  if (Buffer.byteLength(password, 'utf8') > 512) return null
  if (setting.length < 12) return null
  const settingHead = setting.slice(0, 12)
  if (settingHead[0] !== '$' || settingHead[2] !== '$') return null

  const countLog2 = ITOA64.indexOf(settingHead[3])
  if (countLog2 < 7 || countLog2 > 30) return null
  const salt = settingHead.slice(4, 12)
  if (salt.length !== 8) return null

  const passwordBuf = Buffer.from(password, 'utf8')
  const saltBuf = Buffer.from(salt, 'utf8')

  let hash = createHash(algo).update(Buffer.concat([saltBuf, passwordBuf])).digest()
  let count = 1 << countLog2
  do {
    hash = createHash(algo).update(Buffer.concat([hash, passwordBuf])).digest()
  } while (--count)

  const output = settingHead + passwordBase64Encode(hash, hash.length)
  const expected = 12 + Math.ceil((8 * hash.length) / 6)
  if (output.length !== expected) return null
  return output.slice(0, 55) // DRUPAL_HASH_LENGTH
}

/**
 * Verify a plaintext password against a Drupal-style stored hash.
 * Returns true if the password matches.
 */
export function checkPassword(password: string, storedHash: string): boolean {
  let hashToCheck = storedHash
  let pw = password

  // Legacy: 'U$' prefix indicates a hash that's been double-hashed via md5() during D6→D7 upgrade.
  if (storedHash.startsWith('U$')) {
    hashToCheck = storedHash.slice(1)
    pw = createHash('md5').update(password, 'utf8').digest('hex')
  }

  const type = hashToCheck.slice(0, 3)
  let computed: string | null = null
  if (type === '$S$') computed = passwordCrypt('sha512', pw, hashToCheck)
  else if (type === '$P$' || type === '$H$') computed = passwordCrypt('md5', pw, hashToCheck)
  else return false

  return computed !== null && computed === hashToCheck
}
