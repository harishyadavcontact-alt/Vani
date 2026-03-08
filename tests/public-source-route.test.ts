import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('POST /api/source/public', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('returns a normalized anonymous queue for valid public inputs', async () => {
    const { POST } = await import('@/app/api/source/public/route')
    const response = await POST(new Request('http://localhost/api/source/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: '@paulg' }),
    }))

    const json = await response.json()
    expect(response.status).toBe(200)
    expect(json.listenMode).toBe('anonymous')
    expect(json.status).toBe('ok')
    expect(json.resolvedSource.kind).toBe('user')
    expect(Array.isArray(json.items)).toBe(true)
    expect(json.canReply).toBe(false)
  })

  it('returns invalid_source for malformed or unsupported public inputs', async () => {
    const { POST } = await import('@/app/api/source/public/route')
    const response = await POST(new Request('http://localhost/api/source/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: 'https://x.com/i/bookmarks' }),
    }))

    const json = await response.json()
    expect(response.status).toBe(400)
    expect(json.status).toBe('invalid_source')
    expect(json.error.code).toBe('UNSUPPORTED_X_URL')
  })

  it('returns empty for valid public sources with no playable items', async () => {
    const { POST } = await import('@/app/api/source/public/route')
    const response = await POST(new Request('http://localhost/api/source/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: 'https://x.com/unknown/status/9999999999' }),
    }))

    const json = await response.json()
    expect(response.status).toBe(200)
    expect(json.status).toBe('empty')
    expect(json.items).toEqual([])
  })

  it('returns temporary_failure when the source service cannot complete', async () => {
    vi.doMock('@/lib/server/services/source-service', () => ({
      getAnonymousPublicSourceResponse: vi.fn().mockResolvedValue({
        items: [],
        nextCursor: null,
        capabilities: {
          canReply: false,
          canLike: false,
          canFetchForYou: false,
          rateLimitRemaining: 0,
        },
        fallbackSource: null,
        statusMessages: {
          source: 'Temporary failure.',
          reply: 'Log in to reply.',
          like: 'Log in to like.',
          fetchForYou: 'Unavailable.',
        },
        canReply: false,
        canLike: false,
        canFetchForYou: false,
        listenMode: 'anonymous',
        status: 'temporary_failure',
        resolvedSource: null,
        error: {
          code: 'TEMPORARY_FAILURE',
          message: 'Temporary failure.',
        },
      }),
    }))

    const { POST } = await import('@/app/api/source/public/route')
    const response = await POST(new Request('http://localhost/api/source/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: '@paulg' }),
    }))

    const json = await response.json()
    expect(response.status).toBe(503)
    expect(json.status).toBe('temporary_failure')
    expect(json.error.code).toBe('TEMPORARY_FAILURE')
  })
})
