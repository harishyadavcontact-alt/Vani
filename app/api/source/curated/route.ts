import { NextResponse } from 'next/server'
import { getCuratedSourceResponse } from '@/lib/server/services/source-service'

export async function GET() {
  return NextResponse.json(getCuratedSourceResponse())
}
