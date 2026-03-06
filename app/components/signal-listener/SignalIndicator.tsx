import styles from './SignalListener.module.css'

type SignalIndicatorProps = {
  label?: string
}

export function SignalIndicator({ label = 'Signal Live' }: SignalIndicatorProps) {
  return (
    <div className={styles.signalIndicator}>
      <span className={styles.ping} />
      {label}
    </div>
  )
}
