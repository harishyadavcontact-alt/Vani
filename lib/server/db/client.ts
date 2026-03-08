import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { getEnv, hasDatabase } from '../env'
import * as schema from './schema'

let pool: Pool | null = null

export function getDb() {
  if (!hasDatabase()) return null
  if (!pool) {
    pool = new Pool({
      connectionString: getEnv().DATABASE_URL,
      max: 5,
    })
  }

  return drizzle(pool, { schema })
}

export async function closeDb() {
  if (pool) {
    await pool.end()
    pool = null
  }
}
