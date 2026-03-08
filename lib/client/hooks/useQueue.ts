'use client'

import { useEffect, useState, useTransition } from 'react'
import type { QueueItem } from '@/lib/domain/entities'

export function useQueue(initialQueue: QueueItem[]) {
  const [queue, setQueue] = useState(initialQueue)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setQueue(initialQueue)
  }, [initialQueue])

  function move(itemId: string, direction: 'up' | 'down') {
    startTransition(async () => {
      const response = await fetch('/api/queue/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, direction }),
      })
      if (!response.ok) return
      const json = (await response.json()) as { items: QueueItem[] }
      setQueue(json.items)
    })
  }

  return {
    queue,
    isQueuePending: isPending,
    setQueue,
    move,
  }
}
