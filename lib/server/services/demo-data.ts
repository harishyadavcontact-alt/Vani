import { CURATED_TWEETS, HOME_TWEETS, LIST_TWEETS, threadTweets, userTweets } from '@/app/lib/mockData'
import type { BootstrappedAppState, FeedItem, QueueItem, SourceConfig } from '@/lib/domain/entities'

function toFeedItem(sourceKind: FeedItem['sourceKind'], sourceLabel: string, tweet: { id: string; authorName: string; authorHandle: string; text: string; createdAt: string }): FeedItem {
  return {
    id: `${sourceKind}-${tweet.id}`,
    externalId: tweet.id,
    sourceKind,
    sourceLabel,
    authorName: tweet.authorName,
    authorHandle: tweet.authorHandle,
    authorAvatarUrl: `https://unavatar.io/x/${tweet.authorHandle}`,
    text: tweet.text,
    createdAt: tweet.createdAt,
    permalink: `https://x.com/${tweet.authorHandle}/status/${tweet.id}`,
    capabilities: {
      canReply: sourceKind !== 'curated',
      canLike: sourceKind !== 'curated',
      canOpenThread: true,
      canGenerateAudio: true,
    },
  }
}

export function getDemoSources(): SourceConfig[] {
  return [
    { id: 'src-curated', kind: 'curated', label: 'For You', value: 'curated', enabled: true, syncStatus: 'ready' },
    { id: 'src-home', kind: 'home', label: 'Following', value: 'home', enabled: true, syncStatus: 'ready' },
    { id: 'src-list-ai', kind: 'list', label: 'AI & Tech', value: 'ai', enabled: true, syncStatus: 'ready' },
    { id: 'src-bookmarks', kind: 'bookmarks', label: 'Bookmarks', value: 'bookmarks', enabled: true, syncStatus: 'ready' },
    { id: 'src-user-paulg', kind: 'user', label: 'Paul Graham', value: 'paulg', enabled: true, syncStatus: 'ready' },
  ]
}

export function getDemoFeedItems() {
  return [
    ...CURATED_TWEETS.map((tweet) => toFeedItem('curated', 'For You', tweet)),
    ...HOME_TWEETS.map((tweet) => toFeedItem('home', 'Following', tweet)),
    ...HOME_TWEETS.slice(0, 2).map((tweet) => toFeedItem('bookmarks', 'Bookmarks', tweet)),
    ...LIST_TWEETS.ai.map((tweet) => toFeedItem('list', 'AI & Tech', tweet)),
    ...userTweets('paulg').map((tweet) => toFeedItem('user', 'Paul Graham', tweet)),
  ]
}

export function getDemoThread(rootExternalId: string) {
  return threadTweets(rootExternalId).map((tweet) => toFeedItem('home', 'Thread', tweet))
}

export function getDemoQueue(): QueueItem[] {
  return getDemoFeedItems().slice(0, 6).map((feedItem, index) => ({
    id: `queue-${feedItem.id}`,
    feedItemId: feedItem.id,
    order: index,
    status: index === 0 ? 'playing' : 'queued',
    addedAt: new Date().toISOString(),
    feedItem,
  }))
}

export function getDemoBootstrap(): BootstrappedAppState {
  const queue = getDemoQueue()
  return {
    user: {
      id: 'demo-user',
      name: 'Demo User',
      handle: 'vani_listener',
      mode: 'demo',
    },
    sources: getDemoSources(),
    queue,
    playback: {
      id: 'playback-demo',
      queueId: 'queue-demo',
      currentQueueItemId: queue[0]?.id ?? null,
      mode: 'feed',
      speed: 1.25,
      paused: false,
      activeThreadRootId: null,
      updatedAt: new Date().toISOString(),
    },
    featuredThread: getDemoThread('h1'),
    health: {
      database: 'demo',
      audio: 'browser-fallback',
      sync: 'demo',
    },
  }
}
