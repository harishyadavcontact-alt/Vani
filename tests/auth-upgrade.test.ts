import { describe, expect, it } from 'vitest'
import { buildListenReturnTo, buildLoginUpgradeHref } from '@/lib/client/auth-upgrade'

describe('auth upgrade helpers', () => {
  it('builds listen return paths that preserve the public source', () => {
    expect(buildListenReturnTo('')).toBe('/listen')
    expect(buildListenReturnTo('@paulg')).toBe('/listen?publicSource=%40paulg')
  })

  it('builds login upgrade links that round-trip through the listen path', () => {
    expect(buildLoginUpgradeHref('@paulg')).toBe('/api/auth/login?returnTo=%2Flisten%3FpublicSource%3D%2540paulg')
  })
})
