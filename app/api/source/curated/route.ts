import { NextResponse } from 'next/server'
import { CURATED_TWEETS } from '@/app/lib/mockData'
import type { FeedResponse } from '@/app/lib/types'

export async function GET() {
  const capabilities = {
    canReply: false,
    canLike: false,
    canFetchForYou: false,
    rateLimitRemaining: 1000,
  }

  const response: FeedResponse = {
    items: CURATED_TWEETS,
    nextCursor: null,
    capabilities,
    fallbackSource: null,
    statusMessages: {
      source: 'Curated source loaded.',
      reply: 'Replies are unavailable for curated playback.',
      like: 'Likes are unavailable for curated playback.',
      fetchForYou: 'For You is unavailable on the current API plan.',
    },
    canReply: capabilities.canReply,
    canLike: capabilities.canLike,
    canFetchForYou: capabilities.canFetchForYou,
  }

  return NextResponse.json(response)
}
