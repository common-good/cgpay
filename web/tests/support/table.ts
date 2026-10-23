import { resolve, type MagicCtx, type MagicOpts } from './magic'

// How a table argument is read, by how the step ends:
//   values:           no keys, an array of arrays
//   rows:             the first row has the keys, an array of objects
//   row:              the first row has the keys, one record: an object
//   rows pivoted:     the first column has the keys, an array of objects
//   row pivoted:      the first column has the keys, one record: an object
//   values pivoted:   no keys, sideways: an array of arrays
export type Shape = 'values' | 'rows' | 'row' | 'rows pivoted' | 'row pivoted' | 'values pivoted'

/**
 * Convert a table to data in the given shape, with magic values resolved in every cell (the key is the field).
 * @param table: anything with raw() returning the cell text, like the DataTable a step receives
 */
export function tableData(table: { raw(): string[][] }, shape: Shape, ctx: MagicCtx, opts: MagicOpts = {}): unknown {
  const raw = table.raw()
  const cell = (v: string, field?: string) => resolve(v, field, ctx, opts)
  const records = (m: string[][]) => m.slice(1).map(r => Object.fromEntries(m[0].map((k, i) => [k, cell(r[i], k)])))
  const one = (recs: unknown[], what: string) => {
    if (recs.length !== 1) throw new Error(`A table that ends "${shape}:" needs exactly one ${what}, but has ${recs.length}.`)
    return recs[0]
  }

  if (!raw.length) return []
  if (shape === 'values') return raw.map(r => r.map(v => cell(v)))
  if (shape === 'values pivoted') return transpose(raw).map(r => r.map(v => cell(v)))
  if (shape === 'rows') return records(raw)
  if (shape === 'row') return one(records(raw), 'data row')
  if (shape === 'rows pivoted') return records(transpose(raw))
  return one(records(transpose(raw)), 'data column')
}

function transpose(m: string[][]): string[][] { return m[0].map((_, c) => m.map(r => r[c])) }
