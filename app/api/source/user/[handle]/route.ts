import { NextRequest, NextResponse } from 'next/server'
import { userTweets } from '@/app/lib/mockData'
import type { FeedResponse } from '@/app/lib/types'

export async function GET(_req: NextRequest, { params }: { params: { handle: string } }) {
  const response: FeedResponse = {
    items: userTweets(params.handle),
    nextCursor: null,
    capabilities: {
      canReply: true,
      canLike: true,
      canFetchForYou: false,
      rateLimitRemaining: 120,
    },
  }

  return NextResponse.json(response)
}
