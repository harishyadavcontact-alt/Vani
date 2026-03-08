import { NextResponse } from 'next/server'
import { getThreadByExternalId } from '@/lib/server/services/bootstrap-service'

export async function GET(_: Request, { params }: { params: { tweetId: string } }) {
  return NextResponse.json({ items: await getThreadByExternalId(params.tweetId), nextCursor: null })
}
