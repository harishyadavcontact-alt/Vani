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

export type FeedResponse = {
  items: NarrationTweet[]
  nextCursor: string | null
  capabilities: ApiCapabilities
}
