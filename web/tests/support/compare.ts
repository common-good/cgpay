import { resolve, type MagicCtx } from './magic'

const TIME_FIELD = /^(created|modified|updated|received|ckDate|documented)$|(Date|Time)$/
const TIME_SLACK_SECS = 3

/**
 * Check that what the app has (got) includes the rows a table lists (want): each wanted row must match a different
 * row of got, in any order, and got may have more rows. Only the keys in a wanted row are compared. In a wanted value:
 * ? means anything, !x means anything but x, an empty value matches null or empty, numbers compare as numbers,
 * and time fields may differ by a few seconds.
 * @returns the problems found (an empty list means got includes all the wanted rows)
 */
export function rowProblems(got: Record<string, unknown>[], want: Record<string, unknown>[], ctx: MagicCtx): string[] {
  const problems: string[] = []
  const unused = [...got]
  want.forEach((w, i) => {
    const diffs = unused.map(g => fieldProblems(g, w, ctx))
    const best = diffs.reduce((b, d, k) => d.length < diffs[b].length ? k : b, 0)
    if (diffs.length && !diffs[best].length) unused.splice(best, 1)
    else problems.push(`no row matches wanted row ${i + 1}` + (diffs.length ? ` (closest: ${diffs[best].join(', ')})` : ` (the app has no rows left)`))
  })
  return problems
}

function fieldProblems(got: Record<string, unknown>, want: Record<string, unknown>, ctx: MagicCtx): string[] {
  return Object.entries(want).filter(([field, w]) => !matches(got[field], w, field, ctx))
    .map(([field, w]) => `"${field}" is ${JSON.stringify(got[field])}, wanted ${JSON.stringify(w)}`)
}

function matches(got: unknown, want: unknown, field: string, ctx: MagicCtx): boolean {
  if (want === '?') return true
  if (typeof want === 'string' && want.startsWith('!')) return !matches(got, resolve(want.slice(1), field, ctx), field, ctx)
  if (isEmpty(got) && isEmpty(want)) return true
  if (isNumber(got) && isNumber(want)) return TIME_FIELD.test(field) ? Math.abs(+got - +want) <= TIME_SLACK_SECS : +got === +want
  return String(got) === String(want)
}

function isEmpty(v: unknown): boolean { return v === null || v === undefined || v === '' }
function isNumber(v: unknown): v is string | number { return (typeof v === 'number' || (typeof v === 'string' && v.trim() !== '')) && !isNaN(+v) }
