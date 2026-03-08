import { describe, expect, it } from 'vitest'
import { GET as getBookmarks } from '@/app/api/source/bookmarks/route'
import { GET as getCurated } from '@/app/api/source/curated/route'
import { GET as getHome } from '@/app/api/source/home/route'
import { GET as getList } from '@/app/api/source/list/[listId]/route'
import { GET as getUser } from '@/app/api/source/user/[handle]/route'
import { GET as getThread } from '@/app/api/thread/[tweetId]/route'
import type { NextRequest } from 'next/server'

describe('source routes', () => {
  it('returns a normalized feed response for curated and home sources', async () => {
    const curated = await getCurated()
    const home = await getHome()

    const curatedJson = await curated.json()
    const homeJson = await home.json()

    expect(curatedJson.capabilities.canReply).toBe(false)
    expect(curatedJson.canReply).toBe(false)
    expect(curatedJson.statusMessages.source).toContain('Curated')
    expect(homeJson.capabilities.canReply).toBe(true)
    expect(homeJson.fallbackSource).toBe('curated')
    expect(homeJson.nextCursor).toBeNull()
  })

  it('returns normalized list, user, and bookmark feeds', async () => {
    const listResponse = await getList(new Request('http://localhost/api/source/list/ai') as NextRequest, { params: { listId: 'ai' } })
    const userResponse = await getUser(new Request('http://localhost/api/source/user/paulg') as NextRequest, { params: { handle: 'paulg' } })
    const bookmarksResponse = await getBookmarks()

    const listJson = await listResponse.json()
    const userJson = await userResponse.json()
    const bookmarksJson = await bookmarksResponse.json()

    expect(listJson.items.length).toBeGreaterThan(0)
    expect(listJson.capabilities.rateLimitRemaining).toBe(75)
    expect(userJson.statusMessages.source).toContain('@paulg')
    expect(bookmarksJson.items.length).toBe(2)
    expect(bookmarksJson.canLike).toBe(true)
  })

  it('returns thread payloads for the demo shell', async () => {
    const response = await getThread(new Request('http://localhost/api/thread/h1'), { params: { tweetId: 'h1' } })
    const json = await response.json()

    expect(Array.isArray(json.items)).toBe(true)
    expect(json.nextCursor).toBeNull()
  })
})
