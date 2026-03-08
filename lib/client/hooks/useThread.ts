'use client'

import { useState, useTransition } from 'react'
import type { FeedItem } from '@/lib/domain/entities'

export function useThread(initialThread: FeedItem[]) {
  const [threadItems, setThreadItems] = useState(initialThread)
  const [threadRootId, setThreadRootId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function loadThread(externalId: string) {
    startTransition(async () => {
      const response = await fetch(`/api/thread/${externalId}`, { cache: 'no-store' })
      if (!response.ok) return
      const json = (await response.json()) as { items: FeedItem[] }
      setThreadItems(json.items)
      setThreadRootId(externalId)
      setOpen(true)
    })
  }

  return {
    threadItems,
    threadRootId,
    threadOpen: open,
    isThreadPending: isPending,
    loadThread,
    closeThread: () => setOpen(false),
  }
}
