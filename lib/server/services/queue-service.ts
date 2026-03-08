import type { QueueItem } from '@/lib/domain/entities'
import { reorderQueueItems } from '@/lib/domain/queue'
import { getDemoQueue } from './demo-data'

export async function getQueue(): Promise<QueueItem[]> {
  return getDemoQueue()
}

export async function reorderQueue(itemId: string, direction: 'up' | 'down') {
  const queue = await getQueue()
  return reorderQueueItems(queue, itemId, direction)
}
