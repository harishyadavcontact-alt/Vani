import type { PublicSourceKind } from '@/app/lib/types'

export type RecentPublicSource = {
  input: string
  label: string
  kind: PublicSourceKind
  savedAt: string
}

export const recentPublicSourcesStorageKey = 'vani:recentPublicSources'
export const recentPublicSourcesEvent = 'vani:recent-public-sources'

export function normalizeRecentPublicSources(entries: RecentPublicSource[], max = 5) {
  const deduped = new Map<string, RecentPublicSource>()

  for (const entry of entries) {
    const input = entry.input.trim()
    if (!input) continue

    deduped.set(input.toLowerCase(), {
      ...entry,
      input,
    })
  }

  return [...deduped.values()]
    .sort((left, right) => Date.parse(right.savedAt) - Date.parse(left.savedAt))
    .slice(0, max)
}

export function parseRecentPublicSources(raw: string | null) {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as RecentPublicSource[]
    return normalizeRecentPublicSources(Array.isArray(parsed) ? parsed : [])
  } catch {
    return []
  }
}

export function mergeRecentPublicSources(existing: RecentPublicSource[], nextEntry: RecentPublicSource, max = 5) {
  return normalizeRecentPublicSources([
    nextEntry,
    ...existing.filter((entry) => entry.input.trim().toLowerCase() !== nextEntry.input.trim().toLowerCase()),
  ], max)
}

export function readRecentPublicSources() {
  if (typeof window === 'undefined') return []
  return parseRecentPublicSources(window.localStorage.getItem(recentPublicSourcesStorageKey))
}

export function saveRecentPublicSource(nextEntry: RecentPublicSource) {
  if (typeof window === 'undefined') return

  const nextEntries = mergeRecentPublicSources(readRecentPublicSources(), nextEntry)
  window.localStorage.setItem(recentPublicSourcesStorageKey, JSON.stringify(nextEntries))
  window.dispatchEvent(new Event(recentPublicSourcesEvent))
}
