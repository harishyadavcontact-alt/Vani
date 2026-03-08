import { describe, expect, it } from 'vitest'
import { resolvePublicSource } from '@/lib/server/services/public-source-resolver'

describe('resolvePublicSource', () => {
  it('resolves public post URLs', () => {
    const result = resolvePublicSource('https://x.com/naval/status/1234567890')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.source.kind).toBe('post')
    expect(result.source.value).toBe('1234567890')
  })

  it('resolves handles and strips the leading at sign', () => {
    const result = resolvePublicSource('@paulg')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.source.kind).toBe('user')
    expect(result.source.value).toBe('paulg')
  })

  it('resolves public list inputs from urls and prefixed identifiers', () => {
    const urlResult = resolvePublicSource('https://x.com/i/lists/ai')
    const idResult = resolvePublicSource('list:builders')

    expect(urlResult.ok).toBe(true)
    expect(idResult.ok).toBe(true)
    if (!urlResult.ok || !idResult.ok) return
    expect(urlResult.source.kind).toBe('list')
    expect(urlResult.source.value).toBe('ai')
    expect(idResult.source.kind).toBe('list')
    expect(idResult.source.value).toBe('builders')
  })

  it('returns structured errors for malformed urls, unsupported urls, and empty input', () => {
    expect(resolvePublicSource('https://x.com/naval/status/not-a-number')).toMatchObject({
      ok: false,
      error: { code: 'MALFORMED_X_URL' },
    })
    expect(resolvePublicSource('https://x.com/i/bookmarks')).toMatchObject({
      ok: false,
      error: { code: 'UNSUPPORTED_X_URL' },
    })
    expect(resolvePublicSource('   ')).toMatchObject({
      ok: false,
      error: { code: 'EMPTY_INPUT' },
    })
  })

  it('returns explicit invalid handle and list identifier errors', () => {
    expect(resolvePublicSource('@bad-handle')).toMatchObject({
      ok: false,
      error: { code: 'INVALID_HANDLE' },
    })
    expect(resolvePublicSource('list:***')).toMatchObject({
      ok: false,
      error: { code: 'INVALID_LIST_IDENTIFIER' },
    })
  })
})
