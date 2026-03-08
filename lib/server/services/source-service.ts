import { CURATED_TWEETS, HOME_TWEETS, LIST_TWEETS, userTweets } from '@/app/lib/mockData'
import type {
  FeedResponse,
  NarrationTweet,
  PublicListenError,
  PublicListenStatus,
  PublicListenRequest,
  ResolvedPublicSourceView,
  SourceType,
  SourceResponse,
} from '@/app/lib/types'
import { resolvePublicSource } from '@/lib/server/services/public-source-resolver'

type FeedPreset = {
  items: NarrationTweet[]
  capabilities: FeedResponse['capabilities']
  fallbackSource: SourceType | null
  statusMessages: FeedResponse['statusMessages']
  listenMode?: FeedResponse['listenMode']
  status?: PublicListenStatus
  resolvedSource?: ResolvedPublicSourceView | null
  error?: PublicListenError | null
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
    listenMode: preset.listenMode ?? 'authenticated',
    status: preset.status ?? 'ok',
    resolvedSource: preset.resolvedSource ?? null,
    error: preset.error ?? null,
  }
}

function findTweetById(tweetId: string) {
  const knownTweets = [
    ...CURATED_TWEETS,
    ...HOME_TWEETS,
    ...Object.values(LIST_TWEETS).flat(),
  ]

  return knownTweets.find((tweet) => tweet.id === tweetId) ?? null
}

function getAnonymousCapabilities(): FeedResponse['capabilities'] {
  return {
    canReply: false,
    canLike: false,
    canFetchForYou: false,
    rateLimitRemaining: 0,
  }
}

function createAnonymousSourceResponse(input: {
  items: NarrationTweet[]
  source: ResolvedPublicSourceView | null
  status: PublicListenStatus
  error?: PublicListenError | null
  sourceMessage: string
}): SourceResponse {
  return createFeedResponse({
    items: input.items,
    capabilities: getAnonymousCapabilities(),
    fallbackSource: null,
    statusMessages: {
      source: input.sourceMessage,
      reply: 'Log in to reply to public posts.',
      like: 'Log in to like public posts.',
      fetchForYou: 'For You is unavailable in anonymous mode.',
    },
    listenMode: 'anonymous',
    status: input.status,
    resolvedSource: input.source,
    error: input.error ?? null,
  })
}

export async function getAnonymousPublicSourceResponse(request: PublicListenRequest): Promise<SourceResponse> {
  const resolved = resolvePublicSource(request.input)
  if (!resolved.ok) {
    return createAnonymousSourceResponse({
      items: [],
      source: null,
      status: 'invalid_source',
      error: resolved.error,
      sourceMessage: resolved.error.message,
    })
  }

  try {
    if (resolved.source.kind === 'post') {
      const tweet = findTweetById(resolved.source.postId)
      const items = tweet ? [tweet] : []
      return createAnonymousSourceResponse({
        items,
        source: resolved.source,
        status: items.length ? 'ok' : 'empty',
        sourceMessage: items.length ? `${resolved.source.label} ready for playback.` : `No public post was found for ${resolved.source.label.toLowerCase()}.`,
      })
    }

    if (resolved.source.kind === 'list') {
      const items = LIST_TWEETS[resolved.source.listId] ?? []
      return createAnonymousSourceResponse({
        items,
        source: resolved.source,
        status: items.length ? 'ok' : 'empty',
        sourceMessage: items.length ? `${resolved.source.label} loaded.` : `${resolved.source.label} is valid but currently empty.`,
      })
    }

    const items = userTweets(resolved.source.handle)
    return createAnonymousSourceResponse({
      items,
      source: resolved.source,
      status: items.length ? 'ok' : 'empty',
      sourceMessage: items.length ? `Public source @${resolved.source.handle} loaded.` : `@${resolved.source.handle} has no playable public posts right now.`,
    })
  } catch {
    return createAnonymousSourceResponse({
      items: [],
      source: resolved.source,
      status: 'temporary_failure',
      error: {
        code: 'TEMPORARY_FAILURE',
        message: 'The public source could not be loaded right now. Try again shortly.',
      },
      sourceMessage: 'The public source could not be loaded right now. Try again shortly.',
    })
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
