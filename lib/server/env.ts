import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DEMO_MODE: z.enum(['true', 'false']).optional().default('true'),
  DATABASE_URL: z.string().optional(),
  APP_URL: z.string().url().optional().default('http://localhost:3000'),
  X_CLIENT_ID: z.string().optional().default(''),
  X_CLIENT_SECRET: z.string().optional().default(''),
  X_REDIRECT_URI: z.string().optional().default(''),
  X_OAUTH_SCOPES: z.string().optional().default('tweet.read tweet.write users.read offline.access like.read list.read follows.read bookmark.read'),
  COOKIE_SECURE: z.string().optional().default(''),
  BLOB_BASE_URL: z.string().optional().default(''),
  CRON_SECRET: z.string().optional().default(''),
})

let cachedEnv: z.infer<typeof envSchema> | null = null

export function getEnv() {
  if (cachedEnv) return cachedEnv
  cachedEnv = envSchema.parse(process.env)
  return cachedEnv
}

export function hasDatabase() {
  return Boolean(getEnv().DATABASE_URL)
}

export function isDemoMode() {
  return getEnv().DEMO_MODE === 'true'
}
