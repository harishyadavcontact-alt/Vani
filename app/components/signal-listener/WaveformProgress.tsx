import styles from './SignalListener.module.css'

type WaveformProgressProps = {
  heights: number[]
  progress: number
  elapsedLabel: string
  totalLabel: string
}

export function WaveformProgress({ heights, progress, elapsedLabel, totalLabel }: WaveformProgressProps) {
  const filledBars = Math.floor(heights.length * progress)

  return (
    <>
      <div className={styles.waveform}>
        {heights.map((height, index) => (
          <div key={`${height}-${index}`} className={styles.wave} style={{ height: `${height}%` }}>
            <div className={styles.waveFill} style={{ height: index < filledBars ? '100%' : '0%' }} />
          </div>
        ))}
      </div>
      <div className={styles.progressRow}>
        <span>{elapsedLabel}</span>
        <span>{totalLabel}</span>
      </div>
    </>
  )
}
