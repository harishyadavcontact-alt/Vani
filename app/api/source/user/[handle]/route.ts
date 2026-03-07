import { NextRequest, NextResponse } from 'next/server'
import { userTweets } from '@/app/lib/mockData'
import type { FeedResponse } from '@/app/lib/types'

export async function GET(_req: NextRequest, { params }: { params: { handle: string } }) {
  const capabilities = {
    canReply: true,
    canLike: true,
    canFetchForYou: false,
    rateLimitRemaining: 120,
  }

  const response: FeedResponse = {
    items: userTweets(params.handle),
    nextCursor: null,
    capabilities,
    fallbackSource: null,
    statusMessages: {
      source: `User source @${params.handle} loaded.`,
      reply: 'Reply is available for user playback.',
      like: 'Like is available for user playback.',
      fetchForYou: 'For You is unavailable on the current API plan.',
    },
    canReply: capabilities.canReply,
    canLike: capabilities.canLike,
    canFetchForYou: capabilities.canFetchForYou,
  }

  return NextResponse.json(response)
}
