import { QueueItem } from './QueueItem'
import styles from './SignalListener.module.css'
import type { SignalItem } from './types'

type QueueListProps = {
  items: SignalItem[]
  startIndex: number
  brokenAvatars: Record<string, boolean>
  onBrokenAvatar: (handle: string) => void
  onSelect: (nextIndex: number) => void
  initialsFor: (name: string) => string
  onMoveQueueItem: (relativeIndex: number, direction: 'up' | 'down') => void
}

export function QueueList({
  items,
  startIndex,
  brokenAvatars,
  onBrokenAvatar,
  onSelect,
  initialsFor,
  onMoveQueueItem,
}: QueueListProps) {
  return (
    <section className={`${styles.panel} ${styles.queuePanel}`}>
      <h3 className={styles.queueHeader}>Up Next</h3>
      {!items.length ? (
        <div className={styles.emptyState}>Queue is clear. Keep listening to load more signals.</div>
      ) : (
        <div className={styles.queueList}>
          {items.map((item, index) => (
            <QueueItem
              key={item.id}
              item={item}
              number={startIndex + index + 2}
              brokenAvatars={brokenAvatars}
              onBrokenAvatar={onBrokenAvatar}
              onSelect={() => onSelect(startIndex + index + 1)}
              initialsFor={initialsFor}
              canMoveUp={index > 0}
              canMoveDown={index < items.length - 1}
              onMoveUp={() => onMoveQueueItem(index, 'up')}
              onMoveDown={() => onMoveQueueItem(index, 'down')}
            />
          ))}
        </div>
      )}
    </section>
  )
}
