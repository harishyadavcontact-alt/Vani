import Image from 'next/image'
import { SpeedControl } from './SpeedControl'
import styles from './SignalListener.module.css'
import type { SignalItem } from './types'

type BottomPlayerProps = {
  item?: SignalItem
  sourceLabel: string
  queueLeft: number
  progress: number
  isPlaying: boolean
  rate: number
  brokenAvatars: Record<string, boolean>
  onBrokenAvatar: (handle: string) => void
  initials: string
  onPrevious: () => void
  onPlayPause: () => void
  onNext: () => void
  onRate: () => void
}

export function BottomPlayer({
  item,
  sourceLabel,
  queueLeft,
  progress,
  isPlaying,
  rate,
  brokenAvatars,
  onBrokenAvatar,
  initials,
  onPrevious,
  onPlayPause,
  onNext,
  onRate,
}: BottomPlayerProps) {
  return (
    <div className={styles.player}>
      <div className={styles.playerInner}>
        <div className={styles.playerProgress}>
          <div className={styles.playerProgressFill} style={{ width: `${progress * 100}%` }} />
        </div>

        <div className={styles.playerTop}>
          <div className={styles.playerThumb}>
            {item && !brokenAvatars[item.authorHandle] ? (
              <Image
                src={`https://unavatar.io/x/${item.authorHandle}`}
                alt={`${item.authorName} profile`}
                width={34}
                height={34}
                unoptimized
                onError={() => onBrokenAvatar(item.authorHandle)}
              />
            ) : (
              initials
            )}
          </div>

          <div>
            <div className={styles.playerTitle}>{item?.authorName ?? 'Signal paused'}</div>
            <div className={styles.playerSub}>{sourceLabel} · {queueLeft} queued</div>
          </div>

          <div className={styles.playerControls}>
            <button className={styles.playerBtn} type="button" onClick={onPrevious} aria-label="previous">←</button>
            <button
              className={`${styles.playerBtn} ${styles.playPrimary}`}
              type="button"
              onClick={onPlayPause}
              aria-label={isPlaying ? 'pause' : 'play'}
            >
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button className={styles.playerBtn} type="button" onClick={onNext} aria-label="next">→</button>
            <SpeedControl rate={rate} onCycle={onRate} />
          </div>
        </div>
      </div>
    </div>
  )
}
