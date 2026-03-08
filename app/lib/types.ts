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

export type PublicSourceKind = 'post' | 'user' | 'list'

export type PublicListenStatus = 'ok' | 'invalid_source' | 'empty' | 'temporary_failure'

export type PublicListenErrorCode =
  | 'EMPTY_INPUT'
  | 'MALFORMED_X_URL'
  | 'UNSUPPORTED_X_URL'
  | 'INVALID_HANDLE'
  | 'INVALID_LIST_IDENTIFIER'
  | 'TEMPORARY_FAILURE'

export type PublicListenRequest = {
  input: string
}

export type PublicListenError = {
  code: PublicListenErrorCode
  message: string
}

export type ResolvedPublicSourceView = {
  kind: PublicSourceKind
  label: string
  rawInput: string
  value: string
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
  listenMode: 'authenticated' | 'anonymous'
  status: PublicListenStatus
  resolvedSource: ResolvedPublicSourceView | null
  error: PublicListenError | null
}

export type SourceResponse = FeedResponse
