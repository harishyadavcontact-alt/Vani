'use client'

import { useEffect, useState } from 'react'
import type { PlaybackSessionView, QueueItem } from '@/lib/domain/entities'

const speeds = [1, 1.25, 1.5, 2]

export function usePlaybackSession(initialPlayback: PlaybackSessionView, queue: QueueItem[]) {
  const [playback, setPlayback] = useState(initialPlayback)
  const [rateIndex, setRateIndex] = useState(() => Math.max(speeds.indexOf(initialPlayback.speed), 0))

  useEffect(() => {
    setPlayback(initialPlayback)
  }, [initialPlayback])

  const currentIndex = Math.max(queue.findIndex((item) => item.id === playback.currentQueueItemId), 0)
  const currentItem = queue[currentIndex] ?? null

  function playPause() {
    setPlayback((current) => ({ ...current, paused: !current.paused, updatedAt: new Date().toISOString() }))
  }

  function next() {
    const nextItem = queue[Math.min(currentIndex + 1, Math.max(queue.length - 1, 0))]
    setPlayback((current) => ({ ...current, currentQueueItemId: nextItem?.id ?? null, updatedAt: new Date().toISOString() }))
  }

  function previous() {
    const previousItem = queue[Math.max(currentIndex - 1, 0)]
    setPlayback((current) => ({ ...current, currentQueueItemId: previousItem?.id ?? null, updatedAt: new Date().toISOString() }))
  }

  function cycleSpeed() {
    setRateIndex((current) => {
      const nextIndex = (current + 1) % speeds.length
      setPlayback((value) => ({ ...value, speed: speeds[nextIndex], updatedAt: new Date().toISOString() }))
      return nextIndex
    })
  }

  function selectQueueItem(queueItemId: string) {
    setPlayback((current) => ({ ...current, currentQueueItemId: queueItemId, paused: false, updatedAt: new Date().toISOString() }))
  }

  return {
    playback,
    currentItem,
    currentIndex,
    playPause,
    next,
    previous,
    cycleSpeed,
    selectQueueItem,
  }
}
