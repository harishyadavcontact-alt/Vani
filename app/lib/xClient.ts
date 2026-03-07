import { clearOAuthUserTokens, getOAuthUserTokens, setOAuthUserTokens } from '@/app/lib/auth'

export class OAuthTokenExpiredError extends Error {}
export class XRateLimitError extends Error {}
export class XPostFailedError extends Error {}

type XCreateTweetResponse = {
  data?: { id: string; text: string }
  errors?: Array<{ message?: string }>
}

async function refreshUserAccessToken(refreshToken: string) {
  const clientId = process.env.X_CLIENT_ID
  const clientSecret = process.env.X_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new OAuthTokenExpiredError('OAuth credentials are missing for token refresh.')
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
    throw new OAuthTokenExpiredError('Unable to refresh OAuth token.')
  }

  const payload = (await response.json()) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
  }

  if (!payload.access_token) {
    throw new OAuthTokenExpiredError('Token refresh did not return access token.')
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? refreshToken,
    expiresAt: payload.expires_in ? Date.now() + payload.expires_in * 1000 : null,
  }
}

async function getValidAccessToken() {
  const tokens = await getOAuthUserTokens()
  if (!tokens) throw new OAuthTokenExpiredError('Missing OAuth user token. Please reconnect X.')

  if (!tokens.expiresAt || tokens.expiresAt > Date.now() + 15_000) {
    return tokens.accessToken
  }

  if (!tokens.refreshToken) {
    await clearOAuthUserTokens()
    throw new OAuthTokenExpiredError('OAuth session expired. Please reconnect X.')
  }

  const refreshed = await refreshUserAccessToken(tokens.refreshToken)
  await setOAuthUserTokens(refreshed)
  return refreshed.accessToken
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
    await clearOAuthUserTokens()
    throw new OAuthTokenExpiredError('OAuth session expired. Please reconnect X.')
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
