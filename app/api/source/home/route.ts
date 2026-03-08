import { NextResponse } from 'next/server'
import { getHomeSourceResponse } from '@/lib/server/services/source-service'

export async function GET() {
  return NextResponse.json(getHomeSourceResponse())
}
