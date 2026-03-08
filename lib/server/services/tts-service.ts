import type { AudioAssetView, FeedItem } from '@/lib/domain/entities'
import { getEnv } from '../env'

export async function ensureAudioAsset(feedItem: FeedItem): Promise<AudioAssetView> {
  const env = getEnv()
  return {
    id: `audio-${feedItem.id}`,
    feedItemId: feedItem.id,
    status: env.BLOB_BASE_URL ? 'ready' : 'pending',
    provider: env.BLOB_BASE_URL ? 'server-cache' : 'browser-fallback',
    url: env.BLOB_BASE_URL ? `${env.BLOB_BASE_URL}/${feedItem.id}.mp3` : null,
    durationMs: Math.max(feedItem.text.length * 32, 4000),
  }
}
