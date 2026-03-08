import type { QueueItem } from '@/lib/domain/entities'

type Props = {
  item: QueueItem | null
  sourceLabel: string
  speed: number
  paused: boolean
  queueLength: number
}

export function NowPlayingCard({ item, sourceLabel, speed, paused, queueLength }: Props) {
  return (
    <section className="hero-card">
      <div className="panel-kicker">Now Playing</div>
      <h2>{item?.feedItem.authorName ?? 'Queue ready when you are'}</h2>
      <p>{item?.feedItem.text ?? 'Pick a source and keep the demo queue moving from the first card onward.'}</p>
      <div className="meta-row">
        <span>{item ? `@${item.feedItem.authorHandle}` : sourceLabel}</span>
        <span>{paused ? 'Paused' : 'Playing'} at {speed}x</span>
        <span>{queueLength} queued</span>
      </div>
    </section>
  )
}
