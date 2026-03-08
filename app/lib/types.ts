import type { BootstrappedAppState } from '@/lib/domain/entities'

export type SourceType = 'curated' | 'home' | 'list' | 'user' | 'bookmarks'
export type AuthMode = 'demo' | 'oauth'
export type AuthSessionState = 'signed_out' | 'guest' | 'connected'

export type AccountUser = {
  name: string
  handle: string
}

export type MeResponse = {
  authenticated: boolean
  mode: AuthMode
  sessionState: AuthSessionState
  provider: 'x'
  providerConnected: boolean
  hasOAuthTokens: boolean
  capabilities: {
    canUseDemo: boolean
    canConnectX: boolean
    canPostReplies: boolean
  }
  user: AccountUser | null
  appState?: BootstrappedAppState
}

export type NarrationTweet = {
  id: string
  authorHandle: string
  authorName: string
  text: string
  createdAt: string
}

export type ApiCapabilities = {
  canReply: boolean
  canLike: boolean
  canFetchForYou: boolean
  rateLimitRemaining: number
}

export type SourceStatusMessages = {
  source: string
  reply: string
  like: string
  fetchForYou: string
}

export type FeedResponse = {
  items: NarrationTweet[]
  nextCursor: string | null
  capabilities: ApiCapabilities
  fallbackSource: SourceType | null
  statusMessages: SourceStatusMessages
  canReply: boolean
  canLike: boolean
  canFetchForYou: boolean
}

export type SourceResponse = FeedResponse
