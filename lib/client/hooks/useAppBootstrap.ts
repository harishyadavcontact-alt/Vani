'use client'

import { useEffect, useState } from 'react'
import type { MeResponse } from '@/app/lib/types'

export function useAppBootstrap() {
  const [data, setData] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const response = await fetch('/api/me', { cache: 'no-store' })
        if (!response.ok) throw new Error('Failed to bootstrap app state')
        const json = (await response.json()) as MeResponse
        if (!cancelled) {
          setData(json)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unknown bootstrap error')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load().catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [])

  return {
    data,
    loading,
    error,
    setData,
  }
}
