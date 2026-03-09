import { NextResponse } from 'next/server'
import { clearAuthState, clearOAuthFlowSession, clearOAuthUserTokens, getAuthContext, getOAuthFlowSession, setAuthState, setOAuthUserTokens } from '@/app/lib/auth'

type OAuthTokenResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}

function getRedirectUri(request: Request) {
  const configured = process.env.X_REDIRECT_URI?.trim()
  if (configured) return configured

  const url = new URL(request.url)
  return `${url.origin}/api/auth/callback`
}

function redirectToApp(request: Request, params: Record<string, string>, returnTo = '/') {
  const safeReturnTo = returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/'
  const target = new URL(safeReturnTo, request.url)
  for (const [key, value] of Object.entries(params)) {
    target.searchParams.set(key, value)
  }
  return NextResponse.redirect(target)
}

export async function GET(request: Request) {
  const auth = await getAuthContext()

  if (auth.mode === 'demo') {
    await clearOAuthFlowSession()
    await clearOAuthUserTokens()
    await setAuthState('connected')
    return redirectToApp(request, { auth: 'demo_connected' })
  }

  const url = new URL(request.url)
  const providerError = url.searchParams.get('error')?.trim()
  const providerErrorDescription = url.searchParams.get('error_description')?.trim()
  const code = url.searchParams.get('code')?.trim()
  const state = url.searchParams.get('state')?.trim()
  const flow = await getOAuthFlowSession()
  const clientId = process.env.X_CLIENT_ID?.trim()

  if (providerError) {
    await clearAuthState()
    await clearOAuthFlowSession()
    await clearOAuthUserTokens()
    return redirectToApp(request, {
      auth_error: 'provider_error',
      message: providerErrorDescription || providerError,
    }, flow?.returnTo)
  }

  if (!clientId) {
    await clearAuthState()
    await clearOAuthFlowSession()
    await clearOAuthUserTokens()
    return redirectToApp(request, {
      auth_error: 'oauth_config_missing',
      message: 'Missing X_CLIENT_ID.',
    }, flow?.returnTo)
  }

  if (!code || !state || !flow) {
    await clearAuthState()
    await clearOAuthFlowSession()
    await clearOAuthUserTokens()
    return redirectToApp(request, {
      auth_error: 'missing_callback_params',
      message: 'Missing OAuth callback parameters.',
    }, flow?.returnTo)
  }

  if (state !== flow.state) {
    await clearAuthState()
    await clearOAuthFlowSession()
    await clearOAuthUserTokens()
    return redirectToApp(request, {
      auth_error: 'invalid_state',
      message: 'OAuth state validation failed.',
    }, flow.returnTo)
  }

  const tokenResponse = await fetch('https://api.x.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: getRedirectUri(request),
      code_verifier: flow.codeVerifier,
    }),
  })

  const payload = (await tokenResponse.json().catch(() => null)) as OAuthTokenResponse | null

  if (!tokenResponse.ok || !payload?.access_token) {
    await clearAuthState()
    await clearOAuthFlowSession()
    await clearOAuthUserTokens()
    return redirectToApp(request, {
      auth_error: 'token_exchange_failed',
      message: payload?.error_description || payload?.error || 'Token exchange failed.',
    }, flow.returnTo)
  }

  await setAuthState('connected')
  await setOAuthUserTokens({
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? null,
    expiresAt: payload.expires_in ? Date.now() + payload.expires_in * 1000 : null,
  })
  await clearOAuthFlowSession()

  return redirectToApp(request, { auth: 'connected' }, flow.returnTo)
}
