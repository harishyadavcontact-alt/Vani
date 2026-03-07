import { NextRequest, NextResponse } from 'next/server'
import { LIST_TWEETS } from '@/app/lib/mockData'
import type { FeedResponse } from '@/app/lib/types'

export async function GET(_req: NextRequest, { params }: { params: { listId: string } }) {
  const items = LIST_TWEETS[params.listId] ?? []
  const capabilities = {
    canReply: true,
    canLike: true,
    canFetchForYou: false,
    rateLimitRemaining: 75,
  }

  const response: FeedResponse = {
    items,
    nextCursor: null,
    capabilities,
    fallbackSource: null,
    statusMessages: {
      source: `List ${params.listId} loaded.`,
      reply: 'Reply is available for list playback.',
      like: 'Like is available for list playback.',
      fetchForYou: 'For You is unavailable on the current API plan.',
    },
    canReply: capabilities.canReply,
    canLike: capabilities.canLike,
    canFetchForYou: capabilities.canFetchForYou,
  }

  return NextResponse.json(response)
}
