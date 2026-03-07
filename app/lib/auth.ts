import { cookies } from 'next/headers'

export const SESSION_COOKIE_NAME = 'vani_auth_state'
export const X_ACCESS_TOKEN_COOKIE_NAME = 'vani_x_access_token'
export const X_REFRESH_TOKEN_COOKIE_NAME = 'vani_x_refresh_token'
export const X_ACCESS_TOKEN_EXPIRES_AT_COOKIE_NAME = 'vani_x_access_token_expires_at'

export type AuthState = 'guest' | 'connected'

export type OAuthUserTokens = {
  accessToken: string
  refreshToken: string | null
  expiresAt: number | null
}

export function isDemoModeEnabled() {
  return process.env.DEMO_MODE === 'true'
}

export async function getAuthState(): Promise<AuthState | null> {
  const store = await cookies()
  const value = store.get(SESSION_COOKIE_NAME)?.value

  if (value === 'guest' || value === 'connected') {
    return value
  }

  return null
}

export async function setAuthState(state: AuthState) {
  const store = await cookies()
  store.set(SESSION_COOKIE_NAME, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
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

export async function setOAuthUserTokens(tokens: OAuthUserTokens) {
  const store = await cookies()
  const secure = process.env.NODE_ENV === 'production'
  const base = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  }

  store.set(X_ACCESS_TOKEN_COOKIE_NAME, tokens.accessToken, base)

  if (tokens.refreshToken) {
    store.set(X_REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, base)
  } else {
    store.delete(X_REFRESH_TOKEN_COOKIE_NAME)
  }

  if (tokens.expiresAt) {
    store.set(X_ACCESS_TOKEN_EXPIRES_AT_COOKIE_NAME, String(tokens.expiresAt), base)
  } else {
    store.delete(X_ACCESS_TOKEN_EXPIRES_AT_COOKIE_NAME)
  }
}

export async function clearOAuthUserTokens() {
  const store = await cookies()
  store.delete(X_ACCESS_TOKEN_COOKIE_NAME)
  store.delete(X_REFRESH_TOKEN_COOKIE_NAME)
  store.delete(X_ACCESS_TOKEN_EXPIRES_AT_COOKIE_NAME)
}
