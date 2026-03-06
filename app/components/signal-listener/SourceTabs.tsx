import styles from './SignalListener.module.css'
import type { SourceTabOption } from './types'

type SourceTabsProps = {
  tabs: SourceTabOption[]
  activeId: string
  onSelect: (tab: SourceTabOption) => void
}

export function SourceTabs({ tabs, activeId, onSelect }: SourceTabsProps) {
  return (
    <div className={styles.sourceTabs}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`${styles.tab} ${activeId === tab.id ? styles.tabActive : ''}`}
          onClick={() => onSelect(tab)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
