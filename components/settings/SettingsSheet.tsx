import type { AuthMode, AuthSessionState } from '@/app/lib/types'
import type { BootstrappedAppState } from '@/lib/domain/entities'

type Props = {
  appState: BootstrappedAppState
  mode: AuthMode
  sessionState: AuthSessionState
  selectedSourceLabel: string
}

export function SettingsSheet({ appState, mode, sessionState, selectedSourceLabel }: Props) {
  return (
    <section className="panel">
      <div className="panel-kicker">Settings</div>
      <div className="stack compact">
        <div className="settings-row">
          <span>Auth mode</span>
          <strong>{mode}</strong>
        </div>
        <div className="settings-row">
          <span>Session</span>
          <strong>{sessionState}</strong>
        </div>
        <div className="settings-row">
          <span>Selected source</span>
          <strong>{selectedSourceLabel}</strong>
        </div>
        <div className="settings-row">
          <span>Database</span>
          <strong>{appState.health.database}</strong>
        </div>
        <div className="settings-row">
          <span>Audio pipeline</span>
          <strong>{appState.health.audio}</strong>
        </div>
        <div className="settings-row">
          <span>Sync pipeline</span>
          <strong>{appState.health.sync}</strong>
        </div>
      </div>
    </section>
  )
}
