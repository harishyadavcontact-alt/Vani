import type { FeedItem } from '@/lib/domain/entities'
import { log } from '../logger'

export async function syncFromX(): Promise<FeedItem[]> {
  log('info', 'x_sync_stub_called')
  return []
}

export async function sendReplyToX(body: string, inReplyToId: string) {
  log('info', 'x_reply_stub_called', { inReplyToId, length: body.length })
  return {
    id: `reply-${Date.now()}`,
    ok: true,
  }
}
