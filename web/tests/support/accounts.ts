// The standard PHP test accounts (makeTestAccounts() in cgmembers admin.inc), by nickname.
// Scenarios say "Abe", never a uid. identifier is what the sign-in form accepts.
// Individuals have password k; companies (Cit, Gis) have none. Abe is the admin; Bea manages Cit; Gis is sponsored and managed by Flo.
type Acct = { fullName: string, identifier: string, password: string | null }

const list = 'Abe One, Bea Two, Citre, Dee Four, Eli Five, Flo Six, Gisette, Hal Ate, Ida Nine'.split(', ')
const nicks = 'Abe Bea Cit Dee Eli Flo Gis Hal Ida'.split(' ')

export const accounts: Record<string, Acct> = Object.fromEntries(nicks.map((nick, i) => [nick, {
  fullName: list[i],
  identifier: 'NEWZP' + 'ABCDEFGHI'[i],
  password: ['Cit', 'Gis'].includes(nick) ? null : 'k'
}]))

export function acct(nick: string): Acct {
  const a = accounts[nick]
  if (!a) throw new Error(`Unknown test account "${nick}". Known: ${nicks.join(', ')}`)
  return a
}

// NEWZPA is uid 26742000017291 in the test DB and the other standard accounts follow in order (makeTestAccounts() in admin.inc).
const UID_FIRST = 26742000017291

export function isNickname(v: string): boolean { return nicks.includes(v) }

/** The uid of a standard test account. */
export function uidOf(nick: string): number {
  acct(nick)
  return UID_FIRST + nicks.indexOf(nick)
}

const uidFields = 'uid uid1 uid2 agt1 agt2 actorUid'.split(' ')
const qidFields = 'qid identifier'.split(' ')

/**
 * What a nickname stands for in the field with the given name (uid fields get the uid, qid fields the account ID, fullName the full name).
 * Returns undefined for any other field, so the nickname is left alone.
 */
export function nicknameFor(nick: string, field: string | undefined): string | number | undefined {
  if (!field || !isNickname(nick)) return undefined
  if (uidFields.includes(field)) return uidOf(nick)
  if (qidFields.includes(field)) return acct(nick).identifier
  if (field === 'fullName') return acct(nick).fullName
  return undefined
}
