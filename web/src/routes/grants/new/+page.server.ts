import type { PageServerLoad } from './$types'
import type { RowDataPacket } from 'mysql2'
import pool from '$lib/server/db'

// Matches US_COUNTRY_ID in cgmembers defs.inc.
const US_COUNTRY_ID = 1228

type StateRow = RowDataPacket & { id: number; abbreviation: string }

export const load: PageServerLoad = async () => {
  const [rows] = await pool.query<StateRow[]>(
    'SELECT id, abbreviation FROM r_states WHERE country_id = ? AND abbreviation IS NOT NULL ORDER BY abbreviation',
    [US_COUNTRY_ID]
  )
  return { states: rows.map(r => ({ id: r.id, abbrev: r.abbreviation })) }
}
