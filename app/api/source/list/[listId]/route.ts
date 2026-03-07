import { NextRequest, NextResponse } from 'next/server'
import { LIST_TWEETS } from '@/app/lib/mockData'

export async function GET(_req: NextRequest, { params }: { params: { listId: string } }) {
  const items = LIST_TWEETS[params.listId] ?? []
  return NextResponse.json({
    items,
    canReply: false,
    canLike: true,
    canFetchForYou: true,
    fallbackSource: 'home',
    statusMessages: {
      source: `List source ${params.listId} is active.`,
      reply: 'Replies are unavailable in list mode. Switch to Following if you want to reply.',
      like: 'Likes are available for this source.',
      fetchForYou: 'Feed loaded successfully.',
    },
    nextCursor: null,
  })
}
