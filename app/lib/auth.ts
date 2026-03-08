import { cookies, headers } from 'next/headers'
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export const SESSION_COOKIE_NAME = 'vani_auth_state'
export const X_ACCESS_TOKEN_COOKIE_NAME = 'vani_x_access_token'
export const X_REFRESH_TOKEN_COOKIE_NAME = 'vani_x_refresh_token'
export const X_ACCESS_TOKEN_EXPIRES_AT_COOKIE_NAME = 'vani_x_access_token_expires_at'
export const X_OAUTH_STATE_COOKIE_NAME = 'vani_x_oauth_state'
export const X_OAUTH_CODE_VERIFIER_COOKIE_NAME = 'vani_x_oauth_code_verifier'

export type PersistedAuthState = 'guest' | 'connected'
export type AuthMode = 'demo' | 'oauth'
export type AuthSessionState = 'signed_out' | 'guest' | 'connected'
export type AuthProvider = 'x'

export type AuthUser = {
  name: string
  handle: string
}

export type OAuthUserTokens = {
  accessToken: string
  refreshToken: string | null
  expiresAt: number | null
}

export type OAuthFlowSession = {
  state: string
  codeVerifier: string
}

export type AuthContext = {
  mode: AuthMode
  sessionState: AuthSessionState
  isAuthenticated: boolean
  provider: AuthProvider
  providerConnected: boolean
  hasOAuthTokens: boolean
  canUseDemo: boolean
  canConnectX: boolean
  canPostReplies: boolean
  user: AuthUser | null
}

const DEMO_GUEST_USER: AuthUser = { name: 'Guest Listener', handle: 'guest' }
const DEMO_CONNECTED_USER: AuthUser = { name: 'Demo User', handle: 'vani_listener' }
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

async function shouldUseSecureCookies() {
  const secureOverride = process.env.COOKIE_SECURE
  if (secureOverride === 'true') return true
  if (secureOverride === 'false') return false

  const headerStore = await headers()
  return headerStore.get('x-forwarded-proto') === 'https'
}

async function getCookieOptions(): Promise<Pick<ResponseCookie, 'httpOnly' | 'sameSite' | 'secure' | 'path' | 'maxAge'>> {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: await shouldUseSecureCookies(),
    path: '/',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  }
}

async function setCookie(name: string, value: string) {
  const store = await cookies()
  store.set(name, value, await getCookieOptions())
}

async function deleteCookie(name: string) {
  const store = await cookies()
  store.set(name, '', {
    ...(await getCookieOptions()),
    expires: new Date(0),
    maxAge: 0,
  })
}

export function isDemoModeEnabled() {
  return process.env.DEMO_MODE === 'true'
}

export async function getPersistedAuthState(): Promise<PersistedAuthState | null> {
  const store = await cookies()
  const value = store.get(SESSION_COOKIE_NAME)?.value

  if (value === 'guest' || value === 'connected') {
    return value
  }

  return null
}

export async function getAuthContext(): Promise<AuthContext> {
  const mode: AuthMode = isDemoModeEnabled() ? 'demo' : 'oauth'
  const persistedState = await getPersistedAuthState()
  const tokens = await getOAuthUserTokens()
  const hasOAuthTokens = Boolean(tokens?.accessToken)

  if (mode === 'demo') {
    const sessionState: AuthSessionState = persistedState === 'connected'
      ? 'connected'
      : persistedState === 'guest'
        ? 'guest'
        : 'signed_out'

    return {
      mode,
      sessionState,
      isAuthenticated: sessionState === 'connected',
      provider: 'x',
      providerConnected: sessionState === 'connected',
      hasOAuthTokens: false,
      canUseDemo: true,
      canConnectX: true,
      canPostReplies: sessionState === 'connected',
      user: sessionState === 'connected'
        ? DEMO_CONNECTED_USER
        : sessionState === 'guest'
          ? DEMO_GUEST_USER
          : null,
    }
  }

  const sessionState: AuthSessionState = persistedState === 'connected' && hasOAuthTokens
    ? 'connected'
    : 'signed_out'

  return {
    mode,
    sessionState,
    isAuthenticated: sessionState === 'connected',
    provider: 'x',
    providerConnected: sessionState === 'connected',
    hasOAuthTokens,
    canUseDemo: false,
    canConnectX: true,
    canPostReplies: sessionState === 'connected',
    user: sessionState === 'connected'
      ? { name: 'Connected X User', handle: 'connected' }
      : null,
  }
}

export async function getAuthState(): Promise<PersistedAuthState | null> {
  const context = await getAuthContext()
  return context.sessionState === 'signed_out' ? null : context.sessionState
}

export async function setAuthState(state: PersistedAuthState) {
  await setCookie(SESSION_COOKIE_NAME, state)
}

export async function clearAuthState() {
  await deleteCookie(SESSION_COOKIE_NAME)
}

export async function clearConnectedAuthSession() {
  await clearAuthState()
  await clearOAuthFlowSession()
  await clearOAuthUserTokens()
}

export async function getOAuthUserTokens(): Promise<OAuthUserTokens | null> {
  const store = await cookies()
  const accessToken = store.get(X_ACCESS_TOKEN_COOKIE_NAME)?.value

  if (!accessToken) return null

  const refreshToken = store.get(X_REFRESH_TOKEN_COOKIE_NAME)?.value ?? null
  const expiresRaw = store.get(X_ACCESS_TOKEN_EXPIRES_AT_COOKIE_NAME)?.value
  const expiresAt = expiresRaw ? Number(expiresRaw) : null

  return {
    accessToken,
    refreshToken,
    expiresAt: Number.isFinite(expiresAt) ? expiresAt : null,
  }
}

export async function getOAuthFlowSession(): Promise<OAuthFlowSession | null> {
  const store = await cookies()
  const state = store.get(X_OAUTH_STATE_COOKIE_NAME)?.value
  const codeVerifier = store.get(X_OAUTH_CODE_VERIFIER_COOKIE_NAME)?.value

  if (!state || !codeVerifier) return null

  return {
    state,
    codeVerifier,
  }
}

export async function setOAuthFlowSession(session: OAuthFlowSession) {
  await setCookie(X_OAUTH_STATE_COOKIE_NAME, session.state)
  await setCookie(X_OAUTH_CODE_VERIFIER_COOKIE_NAME, session.codeVerifier)
}

export async function clearOAuthFlowSession() {
  await deleteCookie(X_OAUTH_STATE_COOKIE_NAME)
  await deleteCookie(X_OAUTH_CODE_VERIFIER_COOKIE_NAME)
}

export async function setOAuthUserTokens(tokens: OAuthUserTokens) {
  await setCookie(X_ACCESS_TOKEN_COOKIE_NAME, tokens.accessToken)

  if (tokens.refreshToken) {
    await setCookie(X_REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken)
  } else {
    await deleteCookie(X_REFRESH_TOKEN_COOKIE_NAME)
  }

  if (tokens.expiresAt) {
    await setCookie(X_ACCESS_TOKEN_EXPIRES_AT_COOKIE_NAME, String(tokens.expiresAt))
  } else {
    await deleteCookie(X_ACCESS_TOKEN_EXPIRES_AT_COOKIE_NAME)
  }
}

export async function clearOAuthUserTokens() {
  await deleteCookie(X_ACCESS_TOKEN_COOKIE_NAME)
  await deleteCookie(X_REFRESH_TOKEN_COOKIE_NAME)
  await deleteCookie(X_ACCESS_TOKEN_EXPIRES_AT_COOKIE_NAME)
}
