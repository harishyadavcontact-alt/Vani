import { NextResponse } from 'next/server'
import { HOME_TWEETS } from '@/app/lib/mockData'

export async function GET() {
  return NextResponse.json({ items: HOME_TWEETS, nextCursor: null })
}
