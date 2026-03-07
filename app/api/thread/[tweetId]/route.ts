import { NextResponse } from 'next/server'
import { threadTweets } from '@/app/lib/mockData'

export async function GET(_: Request, { params }: { params: { tweetId: string } }) {
  return NextResponse.json({ items: threadTweets(params.tweetId), nextCursor: null })
}
