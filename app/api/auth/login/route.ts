import { NextResponse } from 'next/server'
import { createHash, randomBytes } from 'node:crypto'
import { clearAuthState, clearOAuthFlowSession, clearOAuthUserTokens, getAuthContext, setAuthState, setOAuthFlowSession } from '@/app/lib/auth'

const DEFAULT_X_SCOPES = [
  'tweet.read',
  'tweet.write',
  'users.read',
  'offline.access',
  'like.read',
  'list.read',
  'follows.read',
]

function base64UrlEncode(input: Buffer) {
  return input
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function getRedirectUri(request: Request) {
  const configured = process.env.X_REDIRECT_URI?.trim()
  if (configured) return configured

  const url = new URL(request.url)
  return `${url.origin}/api/auth/callback`
}

export async function GET(request: Request) {
  const auth = await getAuthContext()

  if (auth.mode === 'demo') {
    await clearOAuthUserTokens()
    await setAuthState('connected')
    return NextResponse.redirect(new URL('/', request.url))
  }

  const clientId = process.env.X_CLIENT_ID?.trim()
  if (!clientId) {
    return NextResponse.json(
      {
        error: 'MISSING_OAUTH_CONFIG',
        message: 'Set X_CLIENT_ID before using OAuth login. Optionally set X_REDIRECT_URI and X_OAUTH_SCOPES.',
        auth: {
          mode: auth.mode,
          sessionState: auth.sessionState,
          provider: auth.provider,
        },
      },
      { status: 500 },
    )
  }

  const redirectUri = getRedirectUri(request)
  const scope = (process.env.X_OAUTH_SCOPES?.trim() || DEFAULT_X_SCOPES.join(' '))
    .split(/\s+/)
    .filter(Boolean)
    .join(' ')
  const state = base64UrlEncode(randomBytes(24))
  const codeVerifier = base64UrlEncode(randomBytes(48))
  const codeChallenge = base64UrlEncode(createHash('sha256').update(codeVerifier).digest())

  await clearAuthState()
  await clearOAuthUserTokens()
  await clearOAuthFlowSession()
  await setOAuthFlowSession({ state, codeVerifier })

  const authorizeUrl = new URL('https://x.com/i/oauth2/authorize')
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('client_id', clientId)
  authorizeUrl.searchParams.set('redirect_uri', redirectUri)
  authorizeUrl.searchParams.set('scope', scope)
  authorizeUrl.searchParams.set('state', state)
  authorizeUrl.searchParams.set('code_challenge', codeChallenge)
  authorizeUrl.searchParams.set('code_challenge_method', 'S256')

  return NextResponse.redirect(authorizeUrl)
}
