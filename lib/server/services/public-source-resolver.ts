import type { PublicListenError, PublicListenErrorCode, PublicSourceKind } from '@/app/lib/types'

type ResolvedPostSource = {
  kind: 'post'
  rawInput: string
  label: string
  value: string
  postId: string
  handle: string | null
}

type ResolvedUserSource = {
  kind: 'user'
  rawInput: string
  label: string
  value: string
  handle: string
}

type ResolvedListSource = {
  kind: 'list'
  rawInput: string
  label: string
  value: string
  listId: string
}

export type ResolvedPublicSource = ResolvedPostSource | ResolvedUserSource | ResolvedListSource

type ResolvePublicSourceResult =
  | { ok: true; source: ResolvedPublicSource }
  | { ok: false; error: PublicListenError }

const HANDLE_PATTERN = /^[A-Za-z0-9_]{1,15}$/
const LIST_PREFIX = /^list:(.+)$/i

function createError(code: PublicListenErrorCode, message: string): ResolvePublicSourceResult {
  return {
    ok: false,
    error: { code, message },
  }
}

function normalizeHandle(rawHandle: string) {
  return rawHandle.trim().replace(/^@+/, '')
}

function createSource(kind: PublicSourceKind, rawInput: string, value: string): ResolvedPublicSource {
  if (kind === 'post') {
    return {
      kind,
      rawInput,
      label: 'Public post',
      value,
      postId: value,
      handle: null,
    }
  }

  if (kind === 'user') {
    return {
      kind,
      rawInput,
      label: `@${value}`,
      value,
      handle: value,
    }
  }

  return {
    kind,
    rawInput,
    label: `List ${value}`,
    value,
    listId: value,
  }
}

function parseXUrl(rawInput: string): ResolvePublicSourceResult {
  let parsed: URL

  try {
    parsed = new URL(rawInput)
  } catch {
    return createError('MALFORMED_X_URL', 'Paste a valid x.com or twitter.com URL.')
  }

  const hostname = parsed.hostname.replace(/^www\./, '').toLowerCase()
  if (hostname !== 'x.com' && hostname !== 'twitter.com') {
    return createError('UNSUPPORTED_X_URL', 'Only x.com and twitter.com public sources are supported right now.')
  }

  const segments = parsed.pathname.split('/').filter(Boolean)
  if (segments.length >= 3 && segments[1] === 'status') {
    const handle = normalizeHandle(segments[0])
    const postId = segments[2]?.trim()
    if (!HANDLE_PATTERN.test(handle) || !/^\d+$/.test(postId)) {
      return createError('MALFORMED_X_URL', 'Paste a valid public post URL from X.')
    }

    return {
      ok: true,
      source: {
        kind: 'post',
        rawInput,
        label: `Post by @${handle}`,
        value: postId,
        postId,
        handle,
      },
    }
  }

  if (segments.length >= 3 && segments[0] === 'i' && segments[1] === 'lists') {
    const listId = segments[2]?.trim()
    if (!listId || !/^[A-Za-z0-9_-]{1,64}$/.test(listId)) {
      return createError('INVALID_LIST_IDENTIFIER', 'Paste a valid public list URL or list identifier.')
    }

    return {
      ok: true,
      source: createSource('list', rawInput, listId),
    }
  }

  if (segments.length === 1) {
    const handle = normalizeHandle(segments[0])
    if (!HANDLE_PATTERN.test(handle)) {
      return createError('INVALID_HANDLE', 'Paste a valid public handle such as @paulg.')
    }

    return {
      ok: true,
      source: createSource('user', rawInput, handle),
    }
  }

  return createError('UNSUPPORTED_X_URL', 'That X URL is not supported yet. Use a public post URL, profile URL, or list URL.')
}

export function resolvePublicSource(rawInput: string): ResolvePublicSourceResult {
  const input = rawInput.trim()
  if (!input) {
    return createError('EMPTY_INPUT', 'Paste a public X post URL, handle, or list to start listening.')
  }

  if (/^https?:\/\//i.test(input)) {
    return parseXUrl(input)
  }

  const listMatch = input.match(LIST_PREFIX)
  if (listMatch) {
    const listId = listMatch[1]?.trim()
    if (!listId || !/^[A-Za-z0-9_-]{1,64}$/.test(listId)) {
      return createError('INVALID_LIST_IDENTIFIER', 'Paste a valid public list URL or list identifier.')
    }

    return {
      ok: true,
      source: createSource('list', rawInput, listId),
    }
  }

  const handle = normalizeHandle(input)
  if (!HANDLE_PATTERN.test(handle)) {
    return createError('INVALID_HANDLE', 'Paste a valid public handle such as @paulg.')
  }

  return {
    ok: true,
    source: createSource('user', rawInput, handle),
  }
}
