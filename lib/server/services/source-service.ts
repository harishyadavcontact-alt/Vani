import { CURATED_TWEETS, HOME_TWEETS, LIST_TWEETS, userTweets } from '@/app/lib/mockData'
import type { FeedResponse, NarrationTweet, SourceType } from '@/app/lib/types'

type FeedPreset = {
  items: NarrationTweet[]
  capabilities: FeedResponse['capabilities']
  fallbackSource: SourceType | null
  statusMessages: FeedResponse['statusMessages']
}

function createFeedResponse(preset: FeedPreset): FeedResponse {
  return {
    items: preset.items,
    nextCursor: null,
    capabilities: preset.capabilities,
    fallbackSource: preset.fallbackSource,
    statusMessages: preset.statusMessages,
    canReply: preset.capabilities.canReply,
    canLike: preset.capabilities.canLike,
    canFetchForYou: preset.capabilities.canFetchForYou,
  }
}

export function getCuratedSourceResponse() {
  return createFeedResponse({
    items: CURATED_TWEETS,
    capabilities: {
      canReply: false,
      canLike: false,
      canFetchForYou: false,
      rateLimitRemaining: 1000,
    },
    fallbackSource: null,
    statusMessages: {
      source: 'Curated source loaded.',
      reply: 'Replies are unavailable for curated playback.',
      like: 'Likes are unavailable for curated playback.',
      fetchForYou: 'For You is unavailable on the current API plan.',
    },
  })
}

export function getHomeSourceResponse() {
  return createFeedResponse({
    items: HOME_TWEETS,
    capabilities: {
      canReply: true,
      canLike: true,
      canFetchForYou: false,
      rateLimitRemaining: 180,
    },
    fallbackSource: 'curated',
    statusMessages: {
      source: 'Following feed loaded.',
      reply: 'Reply is available for following feed items.',
      like: 'Like is available for following feed items.',
      fetchForYou: 'For You is unavailable on the current API plan.',
    },
  })
}

export function getBookmarksSourceResponse() {
  return createFeedResponse({
    items: HOME_TWEETS.slice(0, 2),
    capabilities: {
      canReply: true,
      canLike: true,
      canFetchForYou: false,
      rateLimitRemaining: 60,
    },
    fallbackSource: null,
    statusMessages: {
      source: 'Bookmarks loaded.',
      reply: 'Reply is available for bookmarks.',
      like: 'Like is available for bookmarks.',
      fetchForYou: 'For You is unavailable on the current API plan.',
    },
  })
}

export function getListSourceResponse(listId: string) {
  return createFeedResponse({
    items: LIST_TWEETS[listId] ?? [],
    capabilities: {
      canReply: true,
      canLike: true,
      canFetchForYou: false,
      rateLimitRemaining: 75,
    },
    fallbackSource: null,
    statusMessages: {
      source: `List ${listId} loaded.`,
      reply: 'Reply is available for list playback.',
      like: 'Like is available for list playback.',
      fetchForYou: 'For You is unavailable on the current API plan.',
    },
  })
}

export function getUserSourceResponse(handle: string) {
  return createFeedResponse({
    items: userTweets(handle),
    capabilities: {
      canReply: true,
      canLike: true,
      canFetchForYou: false,
      rateLimitRemaining: 120,
    },
    fallbackSource: null,
    statusMessages: {
      source: `User source @${handle} loaded.`,
      reply: 'Reply is available for user playback.',
      like: 'Like is available for user playback.',
      fetchForYou: 'For You is unavailable on the current API plan.',
    },
  })
}
