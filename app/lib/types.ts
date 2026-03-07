export type SourceType = 'curated' | 'home' | 'list' | 'user'

export type SourceResponse = {
  items: NarrationTweet[]
  canReply: boolean
  canLike: boolean
  canFetchForYou: boolean
  fallbackSource: SourceType | null
  statusMessages: {
    source: string
    reply: string
    like: string
    fetchForYou: string
  }
}

export type NarrationTweet = {
  id: string
  authorHandle: string
  authorName: string
  text: string
  createdAt: string
}
