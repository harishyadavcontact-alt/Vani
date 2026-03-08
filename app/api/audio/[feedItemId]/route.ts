import { NextResponse } from 'next/server'
import { getDemoFeedItems } from '@/lib/server/services/demo-data'
import { ensureAudioAsset } from '@/lib/server/services/tts-service'

export async function GET(_: Request, { params }: { params: { feedItemId: string } }) {
  const item = getDemoFeedItems().find((feedItem) => feedItem.id === params.feedItemId)
  if (!item) {
    return NextResponse.json({ error: 'Audio item not found' }, { status: 404 })
  }

  return NextResponse.json(await ensureAudioAsset(item))
}
