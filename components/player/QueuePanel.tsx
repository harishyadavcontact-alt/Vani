import type { QueueItem } from '@/lib/domain/entities'

type Props = {
  items: QueueItem[]
  currentQueueItemId: string | null
  onSelect: (queueItemId: string) => void
  onMove: (itemId: string, direction: 'up' | 'down') => void
  pending: boolean
}

export function QueuePanel({ items, currentQueueItemId, onSelect, onMove, pending }: Props) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-kicker">Queue</div>
          <h3>Persistent listening inbox</h3>
        </div>
        <span className="muted">{pending ? 'Saving...' : `${items.length} items`}</span>
      </div>

      <div className="stack">
        {items.length === 0 ? (
          <div className="empty-state">
            <strong>No items in this source yet.</strong>
            <p>Switch sources or run a sync to repopulate the listening queue.</p>
          </div>
        ) : null}

        {items.map((item) => (
          <article key={item.id} className={`queue-card ${item.id === currentQueueItemId ? 'active' : ''}`}>
            <div>
              <strong>{item.feedItem.authorName}</strong>
              <p>{item.feedItem.text}</p>
            </div>
            <div className="queue-actions">
              <span className="muted">#{item.order + 1}</span>
              <div className="queue-actions">
                <button type="button" className="mini-pill" onClick={() => onSelect(item.id)}>Play</button>
                <button type="button" className="mini-pill" onClick={() => onMove(item.id, 'up')} disabled={item.order === 0}>Up</button>
                <button type="button" className="mini-pill" onClick={() => onMove(item.id, 'down')} disabled={item.order === items.length - 1}>Down</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
