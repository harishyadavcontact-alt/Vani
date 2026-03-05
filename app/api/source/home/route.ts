import { NextResponse } from 'next/server'
import { HOME_TWEETS } from '@/app/lib/mockData'

export async function GET() {
  return NextResponse.json({
    items: HOME_TWEETS,
    canReply: true,
    canLike: true,
    canFetchForYou: true,
    fallbackSource: null,
    statusMessages: {
      source: 'Following source is active.',
      reply: 'Replies are available for this source.',
      like: 'Likes are available for this source.',
      fetchForYou: 'Feed loaded successfully.',
    },
    nextCursor: null,
  })
}
