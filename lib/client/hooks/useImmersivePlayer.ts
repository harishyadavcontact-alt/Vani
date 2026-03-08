'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { narrationChunks } from '@/app/lib/narration'
import type { ApiCapabilities, MeResponse, NarrationTweet, PublicListenRequest, SourceResponse, SourceType } from '@/app/lib/types'
import { parseConfirmation, parseVoiceIntent } from '@/app/lib/voiceIntents'
import type { FeedItem, SourceConfig } from '@/lib/domain/entities'

type PlayerState = 'IDLE' | 'LOADING' | 'PLAYING' | 'PAUSED' | 'ERROR'
type ComposeState = 'IDLE' | 'DICTATING' | 'CONFIRMING'
type PlayerMode = 'feed' | 'thread'
type FeedSessions = Record<string, SourcePlaybackSession>

type SourcePlaybackSession = {
  cursor: string | null
  queue: NarrationTweet[]
  currentIndex: number
  lastPlayedTweetId: string | null
  lastUpdatedAt: string
  capabilities: ApiCapabilities
  notice: string
}

type ThreadSession = {
  rootTweetId: string | null
  queue: NarrationTweet[]
  currentIndex: number
}

type SpeechRecognitionCtor = new () => {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

const rates = [1, 1.25, 1.5, 2]
const queueStorageKey = 'vani:queueStateBySource'
const selectionStorageKey = 'vani:sourceSelection'
const draftStorageKey = 'vani:replyDrafts'
const sourceOrder: SourceType[] = ['curated', 'home', 'list', 'user']

const defaultCapabilities: ApiCapabilities = {
  canReply: false,
  canLike: false,
  canFetchForYou: false,
  rateLimitRemaining: 0,
}

export const waveformHeights = [30, 50, 70, 45, 80, 60, 35, 75, 55, 40, 65, 85, 50, 30, 70, 60, 40, 80, 55, 45, 75, 35, 60, 90, 50, 40, 70, 55, 80, 65]

export const sourceLabels: Record<SourceType, string> = {
  curated: 'For You',
  home: 'Following',
  list: 'List',
  user: 'User',
  bookmarks: 'Bookmarks',
}

export const avatarSrc = (handle: string) => `https://unavatar.io/x/${handle}`

function createPlaybackSession(queue: NarrationTweet[], currentIndex: number, capabilities: ApiCapabilities, notice: string, cursor: string | null = null, lastPlayedTweetId: string | null = null): SourcePlaybackSession {
  const safeIndex = queue.length ? Math.min(Math.max(currentIndex, 0), queue.length - 1) : 0
  return { cursor, queue, currentIndex: safeIndex, lastPlayedTweetId: queue[safeIndex]?.id ?? lastPlayedTweetId, lastUpdatedAt: new Date().toISOString(), capabilities, notice }
}

function toNarrationTweet(item: NarrationTweet | FeedItem): NarrationTweet {
  return 'externalId' in item
    ? { id: item.externalId, authorHandle: item.authorHandle, authorName: item.authorName, text: item.text, createdAt: item.createdAt }
    : item
}

function getSourceEndpoint(source: SourceConfig | null) {
  if (!source) return null
  if (source.kind === 'curated') return '/api/source/curated'
  if (source.kind === 'home') return '/api/source/home'
  if (source.kind === 'list') return `/api/source/list/${source.value}`
  if (source.kind === 'user') return `/api/source/user/${source.value.replace('@', '')}`
  return null
}

function getPublicSourceKey(rawInput: string) {
  return `public:${rawInput.trim().toLowerCase()}`
}

export function useImmersivePlayer(data: MeResponse | null, initialPublicSource = '') {
  const appState = data?.appState
  const [selectedSourceId, setSelectedSourceId] = useState('')
  const [publicSourceInput, setPublicSourceInput] = useState(initialPublicSource.trim())
  const [sessions, setSessions] = useState<FeedSessions>({})
  const [state, setState] = useState<PlayerState>('IDLE')
  const [rate, setRate] = useState(1.25)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [composeState, setComposeState] = useState<ComposeState>('IDLE')
  const [replyDraft, setReplyDraft] = useState('')
  const [brokenAvatars, setBrokenAvatars] = useState<Record<string, boolean>>({})
  const [notice, setNotice] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const [mode, setMode] = useState<PlayerMode>('feed')
  const [threadSession, setThreadSession] = useState<ThreadSession>({ rootTweetId: null, queue: [], currentIndex: 0 })
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

  const availableSources = useMemo(() => (appState?.sources ?? []).filter((source) => sourceOrder.includes(source.kind)), [appState?.sources])
  const sourceTabs = useMemo(() => sourceOrder.map((kind) => availableSources.find((source) => source.kind === kind)).filter((source): source is SourceConfig => Boolean(source)), [availableSources])
  const selectedSource = useMemo(() => sourceTabs.find((source) => source.id === selectedSourceId) ?? sourceTabs[0] ?? null, [selectedSourceId, sourceTabs])
  const trimmedPublicSourceInput = useMemo(() => publicSourceInput.trim(), [publicSourceInput])
  const usingPublicSource = Boolean(trimmedPublicSourceInput)
  const sourceKey = useMemo(() => usingPublicSource ? getPublicSourceKey(trimmedPublicSourceInput) : selectedSource ? `${selectedSource.kind}:${selectedSource.value}` : 'source:none', [selectedSource, trimmedPublicSourceInput, usingPublicSource])
  const endpoint = useMemo(() => getSourceEndpoint(selectedSource), [selectedSource])
  const feedSession = sessions[sourceKey] ?? createPlaybackSession([], 0, defaultCapabilities, '')
  const feedCurrent = feedSession.queue[feedSession.currentIndex]
  const currentQueue = mode === 'thread' ? threadSession.queue : feedSession.queue
  const currentIndex = mode === 'thread' ? threadSession.currentIndex : feedSession.currentIndex
  const current = currentQueue[currentIndex]
  const queue = currentQueue.slice(currentIndex + 1, currentIndex + 7)
  const activeCapabilities = feedSession.capabilities ?? defaultCapabilities

  const initialsFor = useCallback((name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(), [])
  const updateFeedSession = useCallback((key: string, updater: (session: SourcePlaybackSession) => SourcePlaybackSession) => setSessions((prev) => ({ ...prev, [key]: updater(prev[key] ?? createPlaybackSession([], 0, defaultCapabilities, '')) })), [])
  const updateCurrentFeedSession = useCallback((updater: (session: SourcePlaybackSession) => SourcePlaybackSession) => updateFeedSession(sourceKey, updater), [sourceKey, updateFeedSession])
  const speakMessage = useCallback((message: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const utter = new SpeechSynthesisUtterance(message)
    utter.rate = rate
    utterRef.current = utter
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utter)
  }, [rate])
  const announceNotice = useCallback((message: string) => {
    if (!message || typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const utter = new SpeechSynthesisUtterance(message)
    utter.rate = 1
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utter)
  }, [])
  const setSourceByKind = useCallback((kind: SourceType) => {
    const match = sourceTabs.find((source) => source.kind === kind)
    if (!match) return
    setMode('feed')
    setPublicSourceInput('')
    setSelectedSourceId(match.id)
  }, [sourceTabs])

  const clearPublicSource = useCallback(() => {
    setPublicSourceInput('')
    setMode('feed')
  }, [])

  const setCurrentIndex = useCallback((nextIndex: number) => {
    if (mode === 'thread') {
      setThreadSession((prev) => ({ ...prev, currentIndex: Math.max(0, Math.min(nextIndex, prev.queue.length - 1)) }))
      return
    }
    updateCurrentFeedSession((session) => createPlaybackSession(session.queue, nextIndex, session.capabilities, session.notice, session.cursor, session.lastPlayedTweetId))
  }, [mode, updateCurrentFeedSession])

  const advancePlayback = useCallback(() => {
    if (mode === 'thread') {
      setThreadSession((prev) => ({ ...prev, currentIndex: Math.min(prev.currentIndex + 1, prev.queue.length) }))
      return
    }
    updateCurrentFeedSession((session) => ({ ...session, currentIndex: Math.min(session.currentIndex + 1, session.queue.length), lastPlayedTweetId: session.queue[session.currentIndex]?.id ?? session.lastPlayedTweetId, lastUpdatedAt: new Date().toISOString() }))
  }, [mode, updateCurrentFeedSession])

  const speakChunks = useCallback((chunks: string[], onComplete: () => void) => {
    if (typeof window === 'undefined' || !chunks.length) {
      onComplete()
      return
    }
    const speakAtIndex = (chunkIndex: number) => {
      const text = chunks[chunkIndex]
      if (!text) {
        onComplete()
        return
      }
      const utter = new SpeechSynthesisUtterance(text)
      utter.rate = rate
      utter.onend = () => speakAtIndex(chunkIndex + 1)
      utter.onerror = () => setState('ERROR')
      utterRef.current = utter
      window.speechSynthesis.speak(utter)
    }
    speakAtIndex(0)
  }, [rate])

  const speakCurrent = useCallback(() => {
    if (!current || typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const prefix = mode === 'thread' ? `Thread reply ${currentIndex + 1}. From at ${current.authorHandle}.` : `From at ${current.authorHandle}.`
    speakChunks([prefix, ...narrationChunks(current.text)], advancePlayback)
  }, [advancePlayback, current, currentIndex, mode, speakChunks])

  const loadPublicSource = useCallback(async (rawInput: string) => {
    setState('LOADING')
    const request: PublicListenRequest = { input: rawInput }
    const res = await fetch('/api/source/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      cache: 'no-store',
    })
    const payload = (await res.json()) as SourceResponse
    const sessionKey = getPublicSourceKey(rawInput)
    const priorSession = sessions[sessionKey]
    const recoveredIndex = priorSession?.lastPlayedTweetId ? payload.items.findIndex((item) => item.id === priorSession.lastPlayedTweetId) : -1
    const nextIndex = recoveredIndex >= 0 ? recoveredIndex : Math.min(priorSession?.currentIndex ?? 0, Math.max(payload.items.length - 1, 0))
    const nextNotice = payload.error?.message ?? payload.statusMessages.source
    updateFeedSession(sessionKey, () => createPlaybackSession(payload.items, nextIndex, payload.capabilities, nextNotice, payload.nextCursor, payload.items[nextIndex]?.id ?? priorSession?.lastPlayedTweetId ?? null))
    setNotice(nextNotice)
    setMode('feed')
    setState(payload.status === 'ok' || payload.status === 'empty' ? 'PAUSED' : 'ERROR')
    return payload
  }, [sessions, updateFeedSession])

  const load = useCallback(async () => {
    if (usingPublicSource) {
      await loadPublicSource(trimmedPublicSourceInput)
      return
    }
    if (!endpoint || !selectedSource) return
    setState('LOADING')
    try {
      const res = await fetch(endpoint, { cache: 'no-store' })
      if (!res.ok) throw new Error('Source request failed')
      const payload = (await res.json()) as SourceResponse
      if (!payload.canFetchForYou && payload.fallbackSource && payload.fallbackSource !== selectedSource.kind) {
        const fallbackMessage = `${payload.statusMessages.fetchForYou} Switched to ${sourceLabels[payload.fallbackSource]}.`
        setNotice(fallbackMessage)
        announceNotice(fallbackMessage)
        setSourceByKind(payload.fallbackSource)
        return
      }
      const priorSession = sessions[sourceKey]
      const recoveredIndex = priorSession?.lastPlayedTweetId ? payload.items.findIndex((item) => item.id === priorSession.lastPlayedTweetId) : -1
      const nextIndex = recoveredIndex >= 0 ? recoveredIndex : Math.min(priorSession?.currentIndex ?? 0, Math.max(payload.items.length - 1, 0))
      const nextNotice = [payload.canReply ? '' : payload.statusMessages.reply, payload.canLike ? '' : payload.statusMessages.like].filter(Boolean).join(' ') || payload.statusMessages.source
      updateFeedSession(sourceKey, () => createPlaybackSession(payload.items, nextIndex, payload.capabilities, nextNotice, payload.nextCursor, payload.items[nextIndex]?.id ?? priorSession?.lastPlayedTweetId ?? null))
      setMode('feed')
      setNotice(nextNotice)
      setState('PAUSED')
    } catch {
      setNotice('Unable to load this source right now.')
      setState('ERROR')
    }
  }, [announceNotice, endpoint, loadPublicSource, selectedSource, sessions, setSourceByKind, sourceKey, trimmedPublicSourceInput, updateFeedSession, usingPublicSource])

  const play = useCallback(() => { if (currentQueue.length) setState('PLAYING') }, [currentQueue.length])
  const pause = useCallback(() => { if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel(); setState('PAUSED') }, [])
  const next = useCallback(() => { if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel(); setCurrentIndex(currentIndex + 1) }, [currentIndex, setCurrentIndex])
  const previous = useCallback(() => { if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel(); setCurrentIndex(currentIndex - 1) }, [currentIndex, setCurrentIndex])

  const moveQueueItem = useCallback((relativeIndex: number, direction: 'up' | 'down') => {
    const reorder = (items: NarrationTweet[], absoluteBase: number, indexBase: number) => {
      const currentAbsolute = absoluteBase + 1 + relativeIndex
      const targetAbsolute = direction === 'up' ? currentAbsolute - 1 : currentAbsolute + 1
      if (targetAbsolute < indexBase + 1 || targetAbsolute >= items.length) return items
      const nextItems = [...items]
      ;[nextItems[currentAbsolute], nextItems[targetAbsolute]] = [nextItems[targetAbsolute], nextItems[currentAbsolute]]
      return nextItems
    }
    if (mode === 'thread') {
      setThreadSession((prev) => ({ ...prev, queue: reorder(prev.queue, prev.currentIndex, prev.currentIndex) }))
      return
    }
    updateCurrentFeedSession((session) => ({ ...createPlaybackSession(reorder(session.queue, session.currentIndex, session.currentIndex), session.currentIndex, session.capabilities, session.notice, session.cursor, session.lastPlayedTweetId), lastUpdatedAt: new Date().toISOString() }))
  }, [mode, updateCurrentFeedSession])

  const saveDraftLocally = useCallback((text: string) => {
    if (typeof window === 'undefined') return
    const existing = JSON.parse(localStorage.getItem(draftStorageKey) ?? '[]') as Array<{ text: string; createdAt: string }>
    existing.push({ text, createdAt: new Date().toISOString() })
    localStorage.setItem(draftStorageKey, JSON.stringify(existing))
  }, [])

  const postReply = useCallback(async (text: string) => {
    if (!activeCapabilities.canReply) return speakMessage('Reply is unavailable on the current source.')
    const inReplyTo = mode === 'thread' ? threadSession.queue[threadSession.currentIndex]?.id ?? threadSession.rootTweetId : current?.id
    if (!text.trim() || !inReplyTo) return speakMessage('No reply target is active right now.')
    try {
      const res = await fetch('/api/tweet/reply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, inReplyTo }) })
      if (!res.ok) throw new Error('reply failed')
      setComposeState('IDLE')
      setReplyDraft('')
      speakMessage('Reply sent.')
    } catch {
      saveDraftLocally(text)
      speakMessage('Posting API unavailable. Saved draft locally instead.')
    }
  }, [activeCapabilities.canReply, current, mode, saveDraftLocally, speakMessage, threadSession])

  const openThread = useCallback(async () => {
    if (!feedCurrent) return speakMessage('No item selected to open thread.')
    setState('LOADING')
    try {
      const res = await fetch(`/api/thread/${feedCurrent.id}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('thread failed')
      const payload = (await res.json()) as { items: Array<NarrationTweet | FeedItem> }
      const items = payload.items.map(toNarrationTweet)
      if (!items.length) {
        setState('PAUSED')
        return speakMessage('No replies found for this thread.')
      }
      setThreadSession({ rootTweetId: feedCurrent.id, queue: items, currentIndex: 0 })
      setMode('thread')
      setNotice(`Thread opened for @${feedCurrent.authorHandle}.`)
      setState('PLAYING')
    } catch {
      setState('PAUSED')
      speakMessage('Unable to open thread right now.')
    }
  }, [feedCurrent, speakMessage])

  const exitThreadMode = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    setMode('feed')
    setThreadSession({ rootTweetId: null, queue: [], currentIndex: 0 })
    setNotice(feedSession.notice)
    setState('PAUSED')
    speakMessage('Returned to feed.')
  }, [feedSession.notice, speakMessage])

  useEffect(() => {
    if (!data) return
    try {
      const savedSelection = localStorage.getItem(selectionStorageKey)
      if (savedSelection) {
        const parsed = JSON.parse(savedSelection) as { sourceId?: string; publicSource?: string }
        if (parsed.publicSource?.trim()) {
          setPublicSourceInput(parsed.publicSource)
        } else if (parsed.sourceId && availableSources.some((source) => source.id === parsed.sourceId)) {
          setSelectedSourceId(parsed.sourceId)
        }
      }
    } catch {
      localStorage.removeItem(selectionStorageKey)
    }
    try {
      const rawPersistedState = localStorage.getItem(queueStorageKey)
      if (rawPersistedState) setSessions(JSON.parse(rawPersistedState) as FeedSessions)
    } catch {
      localStorage.removeItem(queueStorageKey)
    }
    if (!selectedSourceId && !trimmedPublicSourceInput && availableSources[0]?.id) setSelectedSourceId(availableSources[0].id)
    setHydrated(true)
  }, [availableSources, data, selectedSourceId, trimmedPublicSourceInput])

  useEffect(() => {
    const nextInput = initialPublicSource.trim()
    if (!nextInput) return
    setPublicSourceInput(nextInput)
    setMode('feed')
  }, [initialPublicSource])

  useEffect(() => {
    if (!hydrated || (!selectedSource && !usingPublicSource)) return
    if (feedSession.queue.length || feedSession.notice) {
      setNotice(feedSession.notice)
      setState((existing) => existing === 'IDLE' ? 'PAUSED' : existing)
      return
    }
    load().catch(() => setState('ERROR'))
  }, [feedSession.notice, feedSession.queue.length, hydrated, load, selectedSource, usingPublicSource])

  useEffect(() => {
    if (!voiceEnabled || typeof window === 'undefined') return
    const recognitionWindow = window as Window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor }
    const Recognition = recognitionWindow.SpeechRecognition || recognitionWindow.webkitSpeechRecognition
    if (!Recognition) return
    const recognition = new Recognition()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1]?.[0]?.transcript?.toLowerCase() ?? ''
      if (composeState === 'DICTATING') {
        setReplyDraft(transcript)
        setComposeState('CONFIRMING')
        return speakMessage(`Draft captured. You said: ${transcript}. Say send to post or cancel to discard.`)
      }
      if (composeState === 'CONFIRMING') {
        const confirmation = parseConfirmation(transcript)
        if (confirmation === 'send') postReply(replyDraft).catch(() => undefined)
        if (confirmation === 'cancel') {
          setComposeState('IDLE')
          setReplyDraft('')
          speakMessage('Reply canceled.')
        }
        return
      }
      const intent = parseVoiceIntent(transcript)
      if (!intent) return
      if (intent.type === 'PAUSE') pause()
      if (intent.type === 'PLAY') play()
      if (intent.type === 'NEXT') next()
      if (intent.type === 'SWITCH_SOURCE') { setSourceByKind(intent.target); speakMessage(`Switched source to ${sourceLabels[intent.target]}.`) }
      if (intent.type === 'OPEN_THREAD') openThread().catch(() => undefined)
      if (intent.type === 'NEXT_REPLY' && mode === 'thread') next()
      if (intent.type === 'BACK_TO_FEED' && mode === 'thread') exitThreadMode()
      if (intent.type === 'REPLY_TO_THIS' || intent.type === 'REPLY') {
        if (!activeCapabilities.canReply) return speakMessage('Reply is unavailable on the current source.')
        if (intent.type === 'REPLY' && intent.text) {
          setReplyDraft(intent.text)
          setComposeState('CONFIRMING')
          return speakMessage(`Draft captured. You said: ${intent.text}. Say send to post or cancel to discard.`)
        }
        setComposeState('DICTATING')
        setReplyDraft('')
        speakMessage('Reply mode enabled. Please dictate your message.')
      }
    }
    recognition.onend = () => { if (voiceEnabled) { try { recognition.start() } catch { return } } }
    try { recognition.start() } catch { return }
    return () => recognition.stop()
  }, [activeCapabilities.canReply, composeState, exitThreadMode, mode, next, openThread, pause, play, postReply, replyDraft, setSourceByKind, speakMessage, voiceEnabled])

  useEffect(() => { if (typeof window !== 'undefined' && hydrated) localStorage.setItem(queueStorageKey, JSON.stringify(sessions)) }, [hydrated, sessions])
  useEffect(() => {
    if (typeof window === 'undefined' || !hydrated) return
    localStorage.setItem(selectionStorageKey, JSON.stringify({
      sourceId: usingPublicSource ? '' : selectedSource?.id ?? '',
      publicSource: trimmedPublicSourceInput,
    }))
  }, [hydrated, selectedSource, trimmedPublicSourceInput, usingPublicSource])
  useEffect(() => { if (state === 'PLAYING') { if (currentIndex >= currentQueue.length) setState('PAUSED'); else speakCurrent() } }, [currentIndex, currentQueue.length, speakCurrent, state])
  useEffect(() => () => { if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel() }, [])

  return {
    appState,
    sourceTabs,
    selectedSource,
    setSelectedSourceId,
    publicSourceInput,
    setPublicSourceInput,
    usingPublicSource,
    clearPublicSource,
    state,
    setState,
    rate,
    setRate,
    voiceEnabled,
    setVoiceEnabled,
    composeState,
    setComposeState,
    replyDraft,
    setReplyDraft,
    brokenAvatars,
    setBrokenAvatars,
    notice,
    mode,
    current,
    currentIndex,
    currentQueue,
    queue,
    feedCurrent,
    threadSession,
    activeCapabilities,
    activeSourceLabel: mode === 'thread' ? 'Thread' : usingPublicSource ? trimmedPublicSourceInput : selectedSource?.label ?? 'Source',
    initialsFor,
    setCurrentIndex,
    load,
    play,
    pause,
    next,
    previous,
    moveQueueItem,
    postReply,
    openThread,
    exitThreadMode,
    speakCurrent,
  }
}
