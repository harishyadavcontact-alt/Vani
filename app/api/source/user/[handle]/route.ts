import { NextRequest, NextResponse } from 'next/server'
import { userTweets } from '@/app/lib/mockData'

export async function GET(_req: NextRequest, { params }: { params: { handle: string } }) {
  return NextResponse.json({ items: userTweets(params.handle), nextCursor: null })
}
