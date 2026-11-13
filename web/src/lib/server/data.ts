// Generic write layer for tables node owns. Server-only. Uses the shared pool, so the DB user
// needs INSERT/UPDATE/DELETE on each allowlisted table (and nothing wider).

import pool from './db'

type Op = 'insert' | 'update' | 'remove'
type Row = Record<string, string | number | null>

// ALLOWLIST: the only tables this module may touch, and how. A table with no entry is refused.
// Before adding one, confirm the table has no side effects that PHP handles in its own
// wrappers (db\insert, db\update, db\del in cg-db.inc): encrypted fields, change tracking,
// soft deletes through the *_all views (DELETED_BY_VIEW), balance recomputation.
// If it has any, do not add it here; give it its own code.
// Never add `users`, tx_* or *_all tables. A unit test fails if you do.
export const ALLOWLIST: Record<string, { ops: Op[]; columns: string[] }> = {
  reset_codes: {
    ops: ['insert', 'update', 'remove'],
    columns: ['id', 'uid', 'codeHash', 'expires', 'tries', 'channel', 'created', 'usedAt']
  }
}

export function isForbidden(table: string) {
  return table === 'users' || table.startsWith('tx_') || table.endsWith('_all')
}

export class DataError extends Error {}

// Throw unless table is allowlisted for op and every key of every row is an allowed column.
function check(table: string, op: Op, ...rows: Row[]) {
  if (isForbidden(table) || !Object.hasOwn(ALLOWLIST, table)) throw new DataError(`table not allowed: ${table}`)
  const entry = ALLOWLIST[table]
  if (!entry.ops.includes(op)) throw new DataError(`${op} not allowed on ${table}`)
  for (const row of rows) {
    for (const k of Object.keys(row)) {
      if (!entry.columns.includes(k)) throw new DataError(`column not allowed on ${table}: ${k}`)
    }
  }
}

function assignments(row: Row, joiner: string) {
  const keys = Object.keys(row)
  return { sql: keys.map(k => `\`${k}\` = ?`).join(joiner), values: keys.map(k => row[k]) }
}

// A null in a where must be IS NULL: `col` = NULL matches nothing.
function conditions(row: Row) {
  const keys = Object.keys(row)
  return { sql: keys.map(k => row[k] === null ? `\`${k}\` IS NULL` : `\`${k}\` = ?`).join(' AND '), values: keys.map(k => row[k]).filter(v => v !== null) }
}

export async function insert(table: string, row: Row) {
  check(table, 'insert', row)
  const keys = Object.keys(row)
  if (!keys.length) throw new DataError('insert needs at least one column')
  const sql = `INSERT INTO \`${table}\` (${keys.map(k => `\`${k}\``).join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`
  const [res] = await pool.execute(sql, keys.map(k => row[k]))
  return res as { insertId: number; affectedRows: number }
}

export async function update(table: string, set: Row, where: Row) {
  check(table, 'update', set, where)
  if (!Object.keys(set).length) throw new DataError('update needs at least one column to set')
  if (!Object.keys(where).length) throw new DataError('update needs a where')
  const s = assignments(set, ', ')
  const w = conditions(where)
  const [res] = await pool.execute(`UPDATE \`${table}\` SET ${s.sql} WHERE ${w.sql}`, [...s.values, ...w.values])
  return res as { affectedRows: number }
}

export async function remove(table: string, where: Row) {
  check(table, 'remove', where)
  if (!Object.keys(where).length) throw new DataError('remove needs a where')
  const w = conditions(where)
  const [res] = await pool.execute(`DELETE FROM \`${table}\` WHERE ${w.sql}`, w.values)
  return res as { affectedRows: number }
}
