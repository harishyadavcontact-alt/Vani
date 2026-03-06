import { SignalIndicator } from './SignalIndicator'
import styles from './SignalListener.module.css'

type TopBarProps = {
  profileInitial: string
}

export function TopBar({ profileInitial }: TopBarProps) {
  return (
    <header className={styles.topBar}>
      <div className={styles.brandBlock}>
        <div className={styles.logo}>vani™</div>
        <SignalIndicator />
      </div>
      <button type="button" className={styles.utilityBtn} aria-label="profile menu">
        {profileInitial}
      </button>
    </header>
  )
}
