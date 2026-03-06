import Image from 'next/image'
import styles from './SignalListener.module.css'
import type { SignalItem } from './types'

type QueueItemProps = {
  item: SignalItem
  number: number
  brokenAvatars: Record<string, boolean>
  onBrokenAvatar: (handle: string) => void
  onSelect: () => void
  initialsFor: (name: string) => string
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
}

export function QueueItem({
  item,
  number,
  brokenAvatars,
  onBrokenAvatar,
  onSelect,
  initialsFor,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: QueueItemProps) {
  return (
    <div className={styles.queueItem}>
      <button type="button" className={styles.queueSelect} onClick={onSelect}>
        <span className={styles.queueNumber}>{number}</span>
        <div className={styles.queueAvatar}>
          {!brokenAvatars[item.authorHandle] ? (
            <Image
              src={`https://unavatar.io/x/${item.authorHandle}`}
              alt={`${item.authorName} profile`}
              width={36}
              height={36}
              unoptimized
              onError={() => onBrokenAvatar(item.authorHandle)}
            />
          ) : (
            initialsFor(item.authorName)
          )}
        </div>
        <div>
          <div className={styles.queueName}>{item.authorName}</div>
          <div className={styles.queueText}>{item.text}</div>
        </div>
        <span className={styles.queueTag}>{item.sourceLabel}</span>
      </button>

      <div className={styles.queueMove}>
        <button type="button" className={styles.queueMoveBtn} disabled={!canMoveUp} onClick={onMoveUp} aria-label="move up">↑</button>
        <button type="button" className={styles.queueMoveBtn} disabled={!canMoveDown} onClick={onMoveDown} aria-label="move down">↓</button>
      </div>
    </div>
  )
}
