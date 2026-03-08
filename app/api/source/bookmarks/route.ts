import { NextResponse } from 'next/server'
import { getBookmarksSourceResponse } from '@/lib/server/services/source-service'

export async function GET() {
  return NextResponse.json(getBookmarksSourceResponse())
}
