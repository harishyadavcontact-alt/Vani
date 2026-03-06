import { NextResponse } from 'next/server'
import { CURATED_TWEETS } from '@/app/lib/mockData'
import type { FeedResponse } from '@/app/lib/types'

export async function GET() {
  const response: FeedResponse = {
    items: CURATED_TWEETS,
    nextCursor: null,
    capabilities: {
      canReply: false,
      canLike: false,
      canFetchForYou: false,
      rateLimitRemaining: 1000,
    },
  }

  return NextResponse.json(response)
}
