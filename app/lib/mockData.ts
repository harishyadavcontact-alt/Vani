import { NarrationTweet } from './types'
import { getCuratedTweets } from './curated'

const now = new Date().toISOString()

export const HOME_TWEETS: NarrationTweet[] = [
  { id: 'h1', authorHandle: 'naval', authorName: 'Naval', text: 'Read what you love until you love to read.', createdAt: now },
  { id: 'h2', authorHandle: 'levelsio', authorName: 'Pieter Levels', text: 'Shipped an experiment in one day. Shipping beats debating.', createdAt: now },
  { id: 'h3', authorHandle: 'sama', authorName: 'Sam Altman', text: 'Small teams can do amazing things with clear focus.', createdAt: now },
]

export const LIST_TWEETS: Record<string, NarrationTweet[]> = {
  builders: [
    { id: 'l1', authorHandle: 'paulg', authorName: 'Paul Graham', text: 'Ideas are fragile. Build quickly before doubt catches up.', createdAt: now },
    { id: 'l2', authorHandle: 'dhh', authorName: 'DHH', text: 'Constraints make software delightful.', createdAt: now },
  ],
  ai: [
    { id: 'a1', authorHandle: 'karpathy', authorName: 'Andrej Karpathy', text: 'The best way to understand a model is to build one.', createdAt: now },
    { id: 'a2', authorHandle: 'goodside', authorName: 'Riley Goodside', text: 'Prompt engineering is mostly clear communication.', createdAt: now },
  ],
}

export const CURATED_TWEETS: NarrationTweet[] = getCuratedTweets()

export const THREAD_TWEETS: Record<string, NarrationTweet[]> = {
  h1: [
    { id: 'h1-r1', authorHandle: 'readwise', authorName: 'Readwise', text: 'And if you annotate as you read, you compound your understanding faster.', createdAt: now },
    { id: 'h1-r2', authorHandle: 'naval', authorName: 'Naval', text: 'The highest ROI habit is learning consistently over years.', createdAt: now },
  ],
  h2: [
    { id: 'h2-r1', authorHandle: 'levelsio', authorName: 'Pieter Levels', text: 'Feedback loops from users beat perfect planning every time.', createdAt: now },
    { id: 'h2-r2', authorHandle: 'indiehackers', authorName: 'Indie Hackers', text: 'Tiny launches create momentum and useful accountability.', createdAt: now },
  ],
  l1: [
    { id: 'l1-r1', authorHandle: 'paulg', authorName: 'Paul Graham', text: 'Most startup advice is timing advice in disguise.', createdAt: now },
    { id: 'l1-r2', authorHandle: 'sama', authorName: 'Sam Altman', text: 'Speed turns unknowns into knowns faster than meetings do.', createdAt: now },
  ],
}

export function threadTweets(tweetId: string): NarrationTweet[] {
  return THREAD_TWEETS[tweetId] ?? []
}

export function userTweets(handle: string): NarrationTweet[] {
  return [
    { id: `${handle}-1`, authorHandle: handle, authorName: handle, text: `Hello from @${handle}. This is your personalized Vani stream.`, createdAt: now },
    { id: `${handle}-2`, authorHandle: handle, authorName: handle, text: 'Keep building. Keep listening to the universe.', createdAt: now },
  ]
}
