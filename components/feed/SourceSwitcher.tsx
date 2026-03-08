import type { SourceConfig } from '@/lib/domain/entities'

type Props = {
  sources: SourceConfig[]
  selectedSourceId: string
  onSelect: (sourceId: string) => void
}

export function SourceSwitcher({ sources, selectedSourceId, onSelect }: Props) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-kicker">Sources</div>
          <h3>Choose the listening lane</h3>
        </div>
        <span className="muted">{sources.filter((source) => source.enabled).length} active</span>
      </div>
      <div className="pill-row">
        {sources.map((source) => (
          <button
            key={source.id}
            className={`pill ${source.id === selectedSourceId ? 'active' : ''}`}
            type="button"
            disabled={!source.enabled}
            onClick={() => onSelect(source.id)}
          >
            {source.label} - {source.syncStatus}
          </button>
        ))}
      </div>
    </section>
  )
}
