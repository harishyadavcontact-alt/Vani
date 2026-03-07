export type SourceType = 'curated' | 'home' | 'list' | 'user'

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
