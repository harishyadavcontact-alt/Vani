import { clearConnectedAuthSession, getOAuthUserTokens, setOAuthUserTokens } from '@/app/lib/auth'

export type OAuthExpiryReason =
  | 'missing_token'
  | 'missing_refresh_token'
  | 'missing_refresh_config'
  | 'refresh_failed'
  | 'invalid_refresh_response'
  | 'post_unauthorized'

export class OAuthTokenExpiredError extends Error {
  constructor(message: string, readonly reason: OAuthExpiryReason) {
    super(message)
    this.name = 'OAuthTokenExpiredError'
  }
}
export class XRateLimitError extends Error {}
export class XPostFailedError extends Error {}

type XCreateTweetResponse = {
  data?: { id: string; text: string }
  errors?: Array<{ message?: string }>
}

function logRefreshEvent(level: 'info' | 'warn' | 'error', event: string, details: Record<string, unknown> = {}) {
  console[level](`[vani:x] ${event}`, details)
}

async function refreshUserAccessToken(refreshToken: string) {
  const clientId = process.env.X_CLIENT_ID
  const clientSecret = process.env.X_CLIENT_SECRET

  logRefreshEvent('info', 'oauth_refresh_attempt', {
    hasClientId: Boolean(clientId),
    hasClientSecret: Boolean(clientSecret),
  })

  if (!clientId || !clientSecret) {
    logRefreshEvent('error', 'oauth_refresh_missing_config', {
      hasClientId: Boolean(clientId),
      hasClientSecret: Boolean(clientSecret),
    })
    throw new OAuthTokenExpiredError('OAuth credentials are missing for token refresh.', 'missing_refresh_config')
  }

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const response = await fetch('https://api.x.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string; error_description?: string } | null
    logRefreshEvent('warn', 'oauth_refresh_failed', {
      status: response.status,
      error: payload?.error ?? null,
      errorDescription: payload?.error_description ?? null,
    })
    throw new OAuthTokenExpiredError('Unable to refresh OAuth token.', 'refresh_failed')
  }

  const payload = (await response.json()) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
  }

  if (!payload.access_token) {
    logRefreshEvent('error', 'oauth_refresh_invalid_response', {
      hasAccessToken: false,
      hasRefreshToken: Boolean(payload.refresh_token),
      expiresIn: payload.expires_in ?? null,
    })
    throw new OAuthTokenExpiredError('Token refresh did not return access token.', 'invalid_refresh_response')
  }

  logRefreshEvent('info', 'oauth_refresh_succeeded', {
    hasRefreshToken: Boolean(payload.refresh_token),
    expiresIn: payload.expires_in ?? null,
  })

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? refreshToken,
    expiresAt: payload.expires_in ? Date.now() + payload.expires_in * 1000 : null,
  }
}

async function getValidAccessToken() {
  const tokens = await getOAuthUserTokens()
  if (!tokens) {
    logRefreshEvent('warn', 'oauth_access_missing_token')
    throw new OAuthTokenExpiredError('Missing OAuth user token. Please reconnect X.', 'missing_token')
  }

  if (!tokens.expiresAt || tokens.expiresAt > Date.now() + 15_000) {
    return tokens.accessToken
  }

  if (!tokens.refreshToken) {
    logRefreshEvent('warn', 'oauth_refresh_missing_refresh_token', {
      expiresAt: tokens.expiresAt,
    })
    await clearConnectedAuthSession()
    throw new OAuthTokenExpiredError('OAuth session expired. Please reconnect X.', 'missing_refresh_token')
  }

  try {
    const refreshed = await refreshUserAccessToken(tokens.refreshToken)
    await setOAuthUserTokens(refreshed)
    return refreshed.accessToken
  } catch (error) {
    if (error instanceof OAuthTokenExpiredError) {
      await clearConnectedAuthSession()
    }
    throw error
  }
}

export async function createReplyTweet(text: string, inReplyToTweetId: string) {
  const accessToken = await getValidAccessToken()

  const response = await fetch('https://api.x.com/2/tweets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      reply: {
        in_reply_to_tweet_id: inReplyToTweetId,
      },
    }),
  })

  if (response.status === 401) {
    logRefreshEvent('warn', 'oauth_post_unauthorized')
    await clearConnectedAuthSession()
    throw new OAuthTokenExpiredError('OAuth session expired. Please reconnect X.', 'post_unauthorized')
  }

  if (response.status === 429) {
    throw new XRateLimitError('Rate limited by X API.')
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as XCreateTweetResponse | null
    const message = body?.errors?.[0]?.message ?? 'Failed to post reply to X.'
    throw new XPostFailedError(message)
  }

  return (await response.json()) as XCreateTweetResponse
}
