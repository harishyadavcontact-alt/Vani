import type { QueueItem } from './entities'

export function reorderQueueItems(items: QueueItem[], itemId: string, direction: 'up' | 'down') {
  const currentIndex = items.findIndex((item) => item.id === itemId)
  if (currentIndex === -1) return items

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= items.length) return items

  const next = [...items]
  const [moved] = next.splice(currentIndex, 1)
  next.splice(targetIndex, 0, moved)

  return next.map((item, index) => ({ ...item, order: index }))
}
