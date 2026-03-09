import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthContext = vi.fn()
const clearAuthState = vi.fn()
const clearOAuthFlowSession = vi.fn()
const clearOAuthUserTokens = vi.fn()
const getOAuthFlowSession = vi.fn()
const setAuthState = vi.fn()
const setOAuthUserTokens = vi.fn()

vi.mock('@/app/lib/auth', () => ({
  getAuthContext,
  clearAuthState,
  clearOAuthFlowSession,
  clearOAuthUserTokens,
  getOAuthFlowSession,
  setAuthState,
  setOAuthUserTokens,
}))

describe('GET /api/auth/callback', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    process.env.X_CLIENT_ID = 'client-id'
  })

  it('returns users to the listen page after a successful oauth exchange', async () => {
    getAuthContext.mockResolvedValue({ mode: 'oauth' })
    getOAuthFlowSession.mockResolvedValue({
      state: 'state-123',
      codeVerifier: 'verifier-123',
      returnTo: '/listen?publicSource=%40paulg',
    })

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 3600,
      }),
    }))

    const { GET } = await import('@/app/api/auth/callback/route')
    const response = await GET(new Request('http://localhost/api/auth/callback?code=code-123&state=state-123'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost/listen?publicSource=%40paulg&auth=connected')
    expect(setAuthState).toHaveBeenCalledWith('connected')
    expect(setOAuthUserTokens).toHaveBeenCalled()
  })
})
