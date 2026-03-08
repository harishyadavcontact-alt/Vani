'use client'

import { useEffect, useMemo, useState } from 'react'
import type { BootstrappedAppState, SourceConfig } from '@/lib/domain/entities'

export function useSources(appState: BootstrappedAppState | undefined) {
  const sources = useMemo(() => appState?.sources ?? [], [appState])
  const [selectedSourceId, setSelectedSourceId] = useState(sources[0]?.id ?? '')

  useEffect(() => {
    if (!selectedSourceId && sources[0]?.id) {
      setSelectedSourceId(sources[0].id)
    }
  }, [selectedSourceId, sources])

  const selectedSource = useMemo(
    () => sources.find((source) => source.id === selectedSourceId) ?? sources[0] ?? null,
    [selectedSourceId, sources],
  )

  return {
    sources,
    selectedSource,
    setSelectedSourceId,
    selectedSourceId,
  }
}
