import { describe, expect, it } from 'vitest'
import { reorderQueueItems } from '@/lib/domain/queue'
import type { QueueItem } from '@/lib/domain/entities'

const queue: QueueItem[] = [
  {
    id: 'q1',
    feedItemId: 'f1',
    order: 0,
    status: 'queued',
    addedAt: '2026-03-08T00:00:00.000Z',
    feedItem: {
      id: 'f1',
      externalId: 'f1',
      sourceKind: 'home',
      sourceLabel: 'Following',
      authorName: 'A',
      authorHandle: 'a',
      authorAvatarUrl: null,
      text: 'one',
      createdAt: '2026-03-08T00:00:00.000Z',
      permalink: null,
      capabilities: { canReply: true, canLike: true, canOpenThread: true, canGenerateAudio: true },
    },
  },
  {
    id: 'q2',
    feedItemId: 'f2',
    order: 1,
    status: 'queued',
    addedAt: '2026-03-08T00:00:00.000Z',
    feedItem: {
      id: 'f2',
      externalId: 'f2',
      sourceKind: 'home',
      sourceLabel: 'Following',
      authorName: 'B',
      authorHandle: 'b',
      authorAvatarUrl: null,
      text: 'two',
      createdAt: '2026-03-08T00:00:00.000Z',
      permalink: null,
      capabilities: { canReply: true, canLike: true, canOpenThread: true, canGenerateAudio: true },
    },
  },
]

describe('reorderQueueItems', () => {
  it('moves an item up and rewrites order', () => {
    const reordered = reorderQueueItems(queue, 'q2', 'up')
    expect(reordered[0]?.id).toBe('q2')
    expect(reordered[0]?.order).toBe(0)
    expect(reordered[1]?.order).toBe(1)
  })
})
