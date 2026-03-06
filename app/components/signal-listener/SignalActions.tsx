import styles from './SignalListener.module.css'
import type { SignalAction } from './types'

const actionLabels: Array<{ action: SignalAction; label: string }> = [
  { action: 'save', label: 'Save' },
  { action: 'summarize', label: 'Summarize' },
  { action: 'expand', label: 'Expand' },
  { action: 'remix', label: 'Remix' },
  { action: 'share', label: 'Share' },
]

type SignalActionsProps = {
  onAction: (action: SignalAction) => void
}

export function SignalActions({ onAction }: SignalActionsProps) {
  return (
    <div className={styles.actions}>
      {actionLabels.map(({ action, label }) => (
        <button key={action} type="button" className={styles.actionBtn} onClick={() => onAction(action)}>
          {label}
        </button>
      ))}
    </div>
  )
}
