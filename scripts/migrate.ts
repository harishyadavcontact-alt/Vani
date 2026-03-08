import { getDb } from '@/lib/server/db/client'

async function main() {
  const db = getDb()
  if (!db) {
    console.log('Skipping migrations because DATABASE_URL is not configured.')
    return
  }

  console.log('Database configured. Create SQL migrations with "npm run db:generate".')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
