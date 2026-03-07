import { NextResponse } from 'next/server'
import { HOME_TWEETS } from '@/app/lib/mockData'
import type { FeedResponse } from '@/app/lib/types'

export async function GET() {
  const capabilities = {
    canReply: true,
    canLike: true,
    canFetchForYou: false,
    rateLimitRemaining: 180,
  }

  const response: FeedResponse = {
    items: HOME_TWEETS,
    nextCursor: null,
    capabilities,
    fallbackSource: 'curated',
    statusMessages: {
      source: 'Following feed loaded.',
      reply: 'Reply is available for following feed items.',
      like: 'Like is available for following feed items.',
      fetchForYou: 'For You is unavailable on the current API plan.',
    },
    canReply: capabilities.canReply,
    canLike: capabilities.canLike,
    canFetchForYou: capabilities.canFetchForYou,
  }

  return NextResponse.json(response)
}
