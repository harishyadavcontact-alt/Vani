import type { SourceTabOption } from './types'

export const sourceTabs: SourceTabOption[] = [
  { id: 'x', label: 'X', source: 'home' },
  { id: 'podcasts', label: 'Podcasts', source: 'list', listId: 'builders' },
  { id: 'essays', label: 'Essays', source: 'user', handle: 'paulg' },
  { id: 'saved', label: 'Saved', source: 'curated' },
  { id: 'following', label: 'Following', source: 'home' },
]

export const waveformHeights = [30, 50, 70, 45, 80, 60, 35, 75, 55, 40, 65, 85, 50, 30, 70, 60, 40, 80, 55, 45, 75, 35, 60, 90, 50, 40, 70, 55, 80, 65]

export const rates = [1, 1.25, 1.5, 2]

export const quickVoiceHints = ['“skip”', '“play next”', '“summarize this”', '“save this”']
