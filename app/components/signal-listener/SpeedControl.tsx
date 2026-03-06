import styles from './SignalListener.module.css'

type SpeedControlProps = {
  rate: number
  onCycle: () => void
}

export function SpeedControl({ rate, onCycle }: SpeedControlProps) {
  return (
    <button className={styles.speed} type="button" onClick={onCycle} aria-label="change speed">
      {rate}×
    </button>
  )
}
