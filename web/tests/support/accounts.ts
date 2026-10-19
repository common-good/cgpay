// The standard PHP test accounts (makeTestAccounts() in cgmembers admin.inc), by nickname.
// Scenarios say "Abe", never a uid. identifier is what the sign-in form accepts.
// Individuals have password k; companies (Cit, Gis) have none.
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
