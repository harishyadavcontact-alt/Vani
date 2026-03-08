type Props = {
  draft: string
  status: 'idle' | 'saving' | 'sent' | 'error'
  enabled: boolean
  onChange: (value: string) => void
  onSend: () => void
}

const statusLabels: Record<Props['status'], string> = {
  idle: 'Ready',
  saving: 'Sending',
  sent: 'Sent',
  error: 'Needs attention',
}

export function ReplyComposer({ draft, status, enabled, onChange, onSend }: Props) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="panel-kicker">Reply</div>
          <h3>Draft or send from the player</h3>
        </div>
        <span className="muted">{statusLabels[status]}</span>
      </div>
      <textarea
        className="composer"
        value={draft}
        disabled={!enabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={enabled ? 'Dictate or type a reply...' : 'Pick a reply-capable item to draft a response.'}
      />
      <div className="panel-actions">
        <button type="button" className="cta" onClick={onSend} disabled={!enabled || !draft.trim() || status === 'saving'}>
          Send Reply
        </button>
      </div>
    </section>
  )
}
