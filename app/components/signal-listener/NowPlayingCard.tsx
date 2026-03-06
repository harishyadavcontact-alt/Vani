import Image from 'next/image'
import styles from './SignalListener.module.css'
import { SignalActions } from './SignalActions'
import { WaveformProgress } from './WaveformProgress'
import type { SignalAction, SignalItem } from './types'

type NowPlayingCardProps = {
  item?: SignalItem
  sourceLabel: string
  progress: number
  waveformHeights: number[]
  stateLabel: string
  brokenAvatars: Record<string, boolean>
  onBrokenAvatar: (handle: string) => void
  initialsFor: (name: string) => string
  onAction: (action: SignalAction) => void
}

export function NowPlayingCard({
  item,
  sourceLabel,
  progress,
  waveformHeights,
  stateLabel,
  brokenAvatars,
  onBrokenAvatar,
  initialsFor,
  onAction,
}: NowPlayingCardProps) {
  return (
    <section className={`${styles.panel} ${styles.nowPlaying}`}>
      <div className={styles.rowBetween}>
        <div className={styles.metaLabel}>Now Playing</div>
        <div className={styles.metaLabel}>{stateLabel}</div>
      </div>

      {!item ? (
        <div className={styles.emptyState}>No signal loaded. Refresh source to continue listening.</div>
      ) : (
        <>
          <div className={styles.authorRow}>
            <div className={styles.avatar}>
              {!brokenAvatars[item.authorHandle] ? (
                <Image
                  src={`https://unavatar.io/x/${item.authorHandle}`}
                  alt={`${item.authorName} profile`}
                  width={44}
                  height={44}
                  unoptimized
                  onError={() => onBrokenAvatar(item.authorHandle)}
                />
              ) : (
                initialsFor(item.authorName)
              )}
            </div>
            <div>
              <div className={styles.authorName}>{item.authorName}</div>
              <div className={styles.authorMeta}>@{item.authorHandle} · {sourceLabel} · {item.relativeTime}</div>
            </div>
          </div>

          <p className={styles.preview}>{item.text}</p>

          <WaveformProgress
            heights={waveformHeights}
            progress={progress}
            elapsedLabel={stateLabel === 'PLAYING' ? '0:14' : '0:00'}
            totalLabel="0:38"
          />

          <SignalActions onAction={onAction} />
        </>
      )}
    </section>
  )
}
