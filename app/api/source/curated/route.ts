import { NextResponse } from 'next/server'
import { CURATED_TWEETS } from '@/app/lib/mockData'

export async function GET() {
  return NextResponse.json({ items: CURATED_TWEETS, nextCursor: null })
}
