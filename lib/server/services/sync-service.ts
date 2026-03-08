import { getDemoFeedItems } from './demo-data'
import { log } from '../logger'

export async function runSourceSync() {
  const items = getDemoFeedItems()
  log('info', 'source_sync_completed', { itemCount: items.length, mode: 'demo' })
  return {
    status: 'ready' as const,
    itemCount: items.length,
  }
}
