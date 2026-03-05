import type { NarrationTweet } from './types'

type CuratedEntry = {
  id: string
  authorHandle: string
  authorName: string
  topic: 'AI' | 'Builders' | 'Product' | 'Research'
  text: string
}

const CURATED_ENTRIES: CuratedEntry[] = [
  {
    id: 'c1',
    authorHandle: 'sama',
    authorName: 'Sam Altman',
    topic: 'AI',
    text: 'Focus on compounding work. The biggest outcomes come from sustained velocity.'
  },
  {
    id: 'c2',
    authorHandle: 'karpathy',
    authorName: 'Andrej Karpathy',
    topic: 'Research',
    text: 'Build tiny experiments often. Understanding follows iteration.'
  },
  {
    id: 'c3',
    authorHandle: 'paulg',
    authorName: 'Paul Graham',
    topic: 'Builders',
    text: 'Start with users who really need what you are making and listen obsessively.'
  },
  {
    id: 'c4',
    authorHandle: 'shreyas',
    authorName: 'Shreyas Doshi',
    topic: 'Product',
    text: 'Clarity beats complexity. Good product decisions are easy to explain in plain language.'
  }
]

function normalizeCuratedEntries(entries: CuratedEntry[]): NarrationTweet[] {
  const createdAt = new Date().toISOString()
  return entries.map((entry) => ({
    id: entry.id,
    authorHandle: entry.authorHandle,
    authorName: `${entry.authorName} • ${entry.topic}`,
    text: entry.text,
    createdAt
  }))
}

export function getCuratedTweets(): NarrationTweet[] {
  // Static local provider for instant playback.
  // Later we can swap this with an X API-backed provider that returns CuratedEntry[]
  // and keep normalizeCuratedEntries as the shared schema adapter.
  return normalizeCuratedEntries(CURATED_ENTRIES)
}
