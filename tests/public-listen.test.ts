import { describe, expect, it } from 'vitest'
import { buildPublicListenHref } from '@/lib/client/public-listen'

describe('buildPublicListenHref', () => {
  it('routes empty input to the listen page without query params', () => {
    expect(buildPublicListenHref('   ')).toBe('/listen')
  })

  it('encodes public source input into the listen query param', () => {
    expect(buildPublicListenHref('@paulg')).toBe('/listen?publicSource=%40paulg')
    expect(buildPublicListenHref('https://x.com/i/lists/ai')).toBe('/listen?publicSource=https%3A%2F%2Fx.com%2Fi%2Flists%2Fai')
  })
})
