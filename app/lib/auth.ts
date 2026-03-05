import { cookies } from 'next/headers'

export const SESSION_COOKIE_NAME = 'vani_auth_state'

export type AuthState = 'guest' | 'connected'

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
    maxAge: 60 * 60 * 24 * 7
  })
}
