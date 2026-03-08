import type { FeedItem } from '@/lib/domain/entities'

type Props = {
  items: FeedItem[]
  open: boolean
  pending: boolean
  onClose: () => void
}

export function ThreadPanel({ items, open, pending, onClose }: Props) {
  if (!open) return null

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-kicker">Thread</div>
          <h3>Expanded conversation</h3>
        </div>
        <button type="button" className="mini-pill" onClick={onClose}>Close</button>
      </div>

      <div className="stack">
        {pending ? <div className="muted">Loading thread...</div> : null}
        {!pending && items.length === 0 ? (
          <div className="empty-state">
            <strong>No thread replies found.</strong>
            <p>This demo item does not have additional replies attached yet.</p>
          </div>
        ) : null}
        {items.map((item) => (
          <article key={item.id} className="thread-card">
            <strong>{item.authorName}</strong>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
