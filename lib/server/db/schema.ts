import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  handle: varchar('handle', { length: 80 }).notNull(),
  email: varchar('email', { length: 255 }),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  provider: varchar('provider', { length: 40 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: integer('expires_at'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const feedSources = pgTable('feed_sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  kind: varchar('kind', { length: 32 }).notNull(),
  label: varchar('label', { length: 120 }).notNull(),
  value: varchar('value', { length: 255 }).notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  syncStatus: varchar('sync_status', { length: 32 }).default('idle').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const feedItems = pgTable('feed_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  sourceId: uuid('source_id').references(() => feedSources.id),
  externalId: varchar('external_id', { length: 255 }).notNull(),
  sourceKind: varchar('source_kind', { length: 32 }).notNull(),
  sourceLabel: varchar('source_label', { length: 120 }).notNull(),
  authorName: varchar('author_name', { length: 120 }).notNull(),
  authorHandle: varchar('author_handle', { length: 80 }).notNull(),
  authorAvatarUrl: text('author_avatar_url'),
  text: text('text').notNull(),
  permalink: text('permalink'),
  capabilities: jsonb('capabilities').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
  syncedAt: timestamp('synced_at', { withTimezone: true }).defaultNow().notNull(),
})

export const listeningQueues = pgTable('listening_queue', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 120 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const queueItems = pgTable('queue_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  queueId: uuid('queue_id').references(() => listeningQueues.id).notNull(),
  feedItemId: uuid('feed_item_id').references(() => feedItems.id).notNull(),
  order: integer('order').notNull(),
  status: varchar('status', { length: 32 }).default('queued').notNull(),
  addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
})

export const playbackSessions = pgTable('playback_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  queueId: uuid('queue_id').references(() => listeningQueues.id).notNull(),
  currentQueueItemId: uuid('current_queue_item_id').references(() => queueItems.id),
  mode: varchar('mode', { length: 32 }).default('feed').notNull(),
  speed: integer('speed').default(125).notNull(),
  paused: boolean('paused').default(true).notNull(),
  activeThreadRootId: varchar('active_thread_root_id', { length: 255 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const replyDrafts = pgTable('reply_drafts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  feedItemId: uuid('feed_item_id').references(() => feedItems.id),
  body: text('body').notNull(),
  status: varchar('status', { length: 32 }).default('draft').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const audioAssets = pgTable('audio_assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  feedItemId: uuid('feed_item_id').references(() => feedItems.id).notNull(),
  provider: varchar('provider', { length: 60 }).default('browser-fallback').notNull(),
  status: varchar('status', { length: 32 }).default('pending').notNull(),
  url: text('url'),
  durationMs: integer('duration_ms'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const syncRuns = pgTable('sync_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  sourceId: uuid('source_id').references(() => feedSources.id),
  status: varchar('status', { length: 32 }).default('queued').notNull(),
  itemsFetched: integer('items_fetched').default(0).notNull(),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
})
