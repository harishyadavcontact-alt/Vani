import type { ReactNode } from 'react'
import styles from './SignalListener.module.css'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <div className={styles.bgGlow} />
      <main className={styles.shell}>{children}</main>
    </>
  )
}
