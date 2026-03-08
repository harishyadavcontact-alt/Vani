import type { BootstrappedAppState } from '@/lib/domain/entities'

type Props = {
  appState: BootstrappedAppState
}

export function OnboardingChecklist({ appState }: Props) {
  const items = [
    { label: 'Connect your account', complete: Boolean(appState.user) },
    { label: 'Enable at least one source', complete: appState.sources.some((source) => source.enabled) },
    { label: 'Generate queue', complete: appState.queue.length > 0 },
    { label: 'Preview thread mode', complete: appState.featuredThread.length > 0 },
  ]

  return (
    <section className="panel onboarding">
      <div className="panel-kicker">Onboarding</div>
      <h3>Ship-ready in three clicks</h3>
      <div className="checklist">
        {items.map((item) => (
          <div key={item.label} className={`check-item ${item.complete ? 'complete' : ''}`}>
            <span>{item.complete ? 'Done' : 'Next'}</span>
            <strong>{item.label}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}
