import type { PageServerLoad } from './$types'
import type { RowDataPacket } from 'mysql2'
import { env } from '$env/dynamic/private'
import pool from '$lib/server/db'

// Matches US_COUNTRY_ID in cgmembers defs.inc.
const US_COUNTRY_ID = 1228

// E2E-only: grants.spec.ts renders this form with no DB (same escape hatch as grants/+layout.server.ts).
const E2E_STATES = [{ id: 1020, abbrev: 'MA' }]

type StateRow = RowDataPacket & { id: number; abbreviation: string }

export const load: PageServerLoad = async ({ cookies }) => {
  if (env.E2E_FAKE_USER === '1' && cookies.get('e2e-fake-user') === 'sponsee') return { states: E2E_STATES }

  const [rows] = await pool.query<StateRow[]>(
    'SELECT id, abbreviation FROM r_states WHERE country_id = ? AND abbreviation IS NOT NULL ORDER BY abbreviation',
    [US_COUNTRY_ID]
  )
  return { states: rows.map(r => ({ id: r.id, abbrev: r.abbreviation })) }
}
