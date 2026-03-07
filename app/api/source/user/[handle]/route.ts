import { NextRequest, NextResponse } from 'next/server'
import { userTweets } from '@/app/lib/mockData'

export async function GET(_req: NextRequest, { params }: { params: { handle: string } }) {
  return NextResponse.json({
    items: userTweets(params.handle),
    canReply: false,
    canLike: false,
    canFetchForYou: false,
    fallbackSource: 'home',
    statusMessages: {
      source: `User source @${params.handle} is currently unavailable.`,
      reply: 'Replies are unavailable for this source right now.',
      like: 'Likes are unavailable for this source right now.',
      fetchForYou: 'User source is unavailable. Falling back to Following feed.',
    },
    nextCursor: null,
  })
}
