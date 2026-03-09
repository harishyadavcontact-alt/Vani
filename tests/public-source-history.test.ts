import { describe, expect, it } from 'vitest'
import { mergeRecentPublicSources, parseRecentPublicSources, type RecentPublicSource } from '@/lib/client/public-source-history'

const now = '2026-03-09T00:00:00.000Z'

describe('public source history helpers', () => {
  it('deduplicates recent sources by input and keeps the newest entry first', () => {
    const existing: RecentPublicSource[] = [
      { input: '@paulg', label: '@paulg', kind: 'user', savedAt: '2026-03-08T23:00:00.000Z' },
      { input: 'https://x.com/i/lists/ai', label: 'List ai', kind: 'list', savedAt: '2026-03-08T22:00:00.000Z' },
    ]

    const merged = mergeRecentPublicSources(existing, {
      input: '@paulg',
      label: '@paulg',
      kind: 'user',
      savedAt: now,
    })

    expect(merged).toHaveLength(2)
    expect(merged[0]?.input).toBe('@paulg')
    expect(merged[0]?.savedAt).toBe(now)
  })

  it('parses invalid storage safely and trims empty entries', () => {
    expect(parseRecentPublicSources('not-json')).toEqual([])
    expect(parseRecentPublicSources(JSON.stringify([
      { input: '   ', label: 'bad', kind: 'user', savedAt: now },
      { input: '@naval', label: '@naval', kind: 'user', savedAt: now },
    ]))).toEqual([
      { input: '@naval', label: '@naval', kind: 'user', savedAt: now },
    ])
  })
})
