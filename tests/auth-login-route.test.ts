import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthContext = vi.fn()
const clearOAuthUserTokens = vi.fn()
const setAuthState = vi.fn()
const clearOAuthFlowSession = vi.fn()
const setOAuthFlowSession = vi.fn()

vi.mock('@/app/lib/auth', () => ({
  getAuthContext,
  clearOAuthUserTokens,
  setAuthState,
  clearOAuthFlowSession,
  setOAuthFlowSession,
  clearAuthState: vi.fn(),
}))

describe('GET /api/auth/login', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    delete process.env.X_CLIENT_ID
  })

  it('keeps the current listen route when demo login upgrades the session', async () => {
    getAuthContext.mockResolvedValue({ mode: 'demo' })

    const { GET } = await import('@/app/api/auth/login/route')
    const response = await GET(new Request('http://localhost/api/auth/login?returnTo=%2Flisten%3FpublicSource%3D%2540paulg'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost/listen?publicSource=%40paulg')
    expect(setAuthState).toHaveBeenCalledWith('connected')
  })

  it('stores returnTo in the oauth flow session before redirecting to X', async () => {
    process.env.X_CLIENT_ID = 'client-id'
    getAuthContext.mockResolvedValue({ mode: 'oauth' })

    const { GET } = await import('@/app/api/auth/login/route')
    const response = await GET(new Request('http://localhost/api/auth/login?returnTo=%2Flisten%3FpublicSource%3D%2540paulg'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('https://x.com/i/oauth2/authorize')
    expect(setOAuthFlowSession).toHaveBeenCalledWith(expect.objectContaining({
      returnTo: '/listen?publicSource=%40paulg',
    }))
  })
})
