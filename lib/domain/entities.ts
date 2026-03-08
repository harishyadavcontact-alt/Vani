export type SourceKind = 'curated' | 'home' | 'list' | 'bookmarks' | 'user'

export type FeedCapabilities = {
  canReply: boolean
  canLike: boolean
  canOpenThread: boolean
  canGenerateAudio: boolean
}

export type FeedItem = {
  id: string
  externalId: string
  sourceKind: SourceKind
  sourceLabel: string
  authorName: string
  authorHandle: string
  authorAvatarUrl: string | null
  text: string
  createdAt: string
  permalink: string | null
  capabilities: FeedCapabilities
}

export type QueueItem = {
  id: string
  feedItemId: string
  order: number
  status: 'queued' | 'playing' | 'played' | 'archived'
  addedAt: string
  feedItem: FeedItem
}

export type PlaybackSessionView = {
  id: string
  queueId: string
  currentQueueItemId: string | null
  mode: 'feed' | 'thread'
  speed: number
  paused: boolean
  activeThreadRootId: string | null
  updatedAt: string
}

export type SourceConfig = {
  id: string
  kind: SourceKind
  label: string
  value: string
  enabled: boolean
  syncStatus: 'idle' | 'syncing' | 'ready' | 'error'
}

export type AudioAssetView = {
  id: string
  feedItemId: string
  status: 'pending' | 'ready' | 'failed'
  provider: string
  url: string | null
  durationMs: number | null
}

export type BootstrappedAppState = {
  user: {
    id: string
    name: string
    handle: string
    mode: 'demo' | 'oauth'
  } | null
  sources: SourceConfig[]
  queue: QueueItem[]
  playback: PlaybackSessionView
  featuredThread: FeedItem[]
  health: {
    database: 'connected' | 'demo'
    audio: 'server' | 'browser-fallback'
    sync: 'ready' | 'demo'
  }
}
