import { NextResponse } from 'next/server'
import { runSourceSync } from '@/lib/server/services/sync-service'

export async function POST() {
  return NextResponse.json(await runSourceSync())
}
