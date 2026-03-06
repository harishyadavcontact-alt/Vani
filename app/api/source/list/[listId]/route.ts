import { NextRequest, NextResponse } from 'next/server'
import { LIST_TWEETS } from '@/app/lib/mockData'
import type { FeedResponse } from '@/app/lib/types'

export async function GET(_req: NextRequest, { params }: { params: { listId: string } }) {
  const items = LIST_TWEETS[params.listId] ?? []

  const response: FeedResponse = {
    items,
    nextCursor: null,
    capabilities: {
      canReply: true,
      canLike: true,
      canFetchForYou: false,
      rateLimitRemaining: 75,
    },
  }

  return NextResponse.json(response)
}
