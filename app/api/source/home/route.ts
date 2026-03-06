import { NextResponse } from 'next/server'
import { HOME_TWEETS } from '@/app/lib/mockData'
import type { FeedResponse } from '@/app/lib/types'

export async function GET() {
  const response: FeedResponse = {
    items: HOME_TWEETS,
    nextCursor: null,
    capabilities: {
      canReply: true,
      canLike: true,
      canFetchForYou: false,
      rateLimitRemaining: 180,
    },
  }

  return NextResponse.json(response)
}
