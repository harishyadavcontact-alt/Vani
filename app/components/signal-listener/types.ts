import type { NarrationTweet, SourceType } from '@/app/lib/types'

export type SourceTabOption = {
  id: string
  label: string
  source: SourceType
  listId?: string
  handle?: string
}

export type SignalAction = 'save' | 'summarize' | 'expand' | 'remix' | 'share'

export type SignalItem = NarrationTweet & {
  sourceLabel: string
  relativeTime: string
}
