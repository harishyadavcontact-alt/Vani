import { beforeEach, describe, expect, it, vi } from 'vitest'

const getAuthContext = vi.fn()
const createReplyTweet = vi.fn()

vi.mock('@/app/lib/auth', () => ({
  getAuthContext,
}))

vi.mock('@/app/lib/xClient', () => ({
  OAuthTokenExpiredError: class OAuthTokenExpiredError extends Error {
    constructor(message: string, readonly reason: string) {
      super(message)
      this.name = 'OAuthTokenExpiredError'
    }
  },
  XRateLimitError: class XRateLimitError extends Error {},
  XPostFailedError: class XPostFailedError extends Error {},
  createReplyTweet,
}))

describe('POST /api/tweet/reply', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('returns demo success when demo auth can post replies', async () => {
    getAuthContext.mockResolvedValue({
      mode: 'demo',
      sessionState: 'connected',
      provider: 'x',
      canPostReplies: true,
    })

    const { POST } = await import('@/app/api/tweet/reply/route')
    const response = await POST(new Request('http://localhost/api/tweet/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Ship it', inReplyTo: 'h1' }),
    }))

    const json = await response.json()
    expect(response.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(String(json.replyId)).toContain('demo-')
    expect(createReplyTweet).not.toHaveBeenCalled()
  })

  it('rejects invalid reply payloads', async () => {
    getAuthContext.mockResolvedValue({
      mode: 'demo',
      sessionState: 'connected',
      provider: 'x',
      canPostReplies: true,
    })

    const { POST } = await import('@/app/api/tweet/reply/route')
    const response = await POST(new Request('http://localhost/api/tweet/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Missing target' }),
    }))

    const json = await response.json()
    expect(response.status).toBe(400)
    expect(json.error).toBe('VALIDATION_ERROR')
  })
})
