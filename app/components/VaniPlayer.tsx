'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { narrationChunks } from '@/app/lib/narration'
import type { ApiCapabilities, NarrationTweet, SourceResponse, SourceType } from '@/app/lib/types'
import { parseConfirmation, parseVoiceIntent } from '@/app/lib/voiceIntents'

type PlayerState = 'IDLE' | 'LOADING' | 'PLAYING' | 'PAUSED' | 'ERROR'
type ComposeState = 'IDLE' | 'DICTATING' | 'CONFIRMING'
type PlayerMode = 'feed' | 'thread'

type SourcePlaybackSession = {
  cursor: string | null
  queue: NarrationTweet[]
  currentIndex: number
  lastPlayedTweetId: string | null
  lastUpdatedAt: string
  capabilities: ApiCapabilities
  notice: string
}

type FeedSessions = Record<string, SourcePlaybackSession>

type ThreadSession = {
  rootTweetId: string | null
  queue: NarrationTweet[]
  currentIndex: number
}

const rates = [1, 1.25, 1.5, 2]
const waveformHeights = [30, 50, 70, 45, 80, 60, 35, 75, 55, 40, 65, 85, 50, 30, 70, 60, 40, 80, 55, 45, 75, 35, 60, 90, 50, 40, 70, 55, 80, 65]
const queueStorageKey = 'vani:queueStateBySource'
const selectionStorageKey = 'vani:sourceSelection'
const validSources: SourceType[] = ['curated', 'home', 'list', 'user']
const defaultCapabilities: ApiCapabilities = {
  canReply: false,
  canLike: false,
  canFetchForYou: false,
  rateLimitRemaining: 0,
}

const sourceTabs: Array<{ label: string; value: SourceType }> = [
  { label: 'For You', value: 'curated' },
  { label: 'Following', value: 'home' },
  { label: 'AI & Tech', value: 'list' },
  { label: 'Founders', value: 'user' },
]

const sourceLabels: Record<SourceType, string> = {
  curated: 'For You',
  home: 'Following',
  list: 'List',
  user: 'User',
}

const avatarSrc = (handle: string) => `https://unavatar.io/x/${handle}`

const createPlaybackSession = (
  queue: NarrationTweet[],
  currentIndex: number,
  capabilities: ApiCapabilities,
  notice: string,
  cursor: string | null = null,
  lastPlayedTweetId: string | null = null,
): SourcePlaybackSession => {
  const safeIndex = queue.length ? Math.min(Math.max(currentIndex, 0), queue.length - 1) : 0
  return {
    cursor,
    queue,
    currentIndex: safeIndex,
    lastPlayedTweetId: queue[safeIndex]?.id ?? lastPlayedTweetId,
    lastUpdatedAt: new Date().toISOString(),
    capabilities,
    notice,
  }
}

export default function VaniPlayer() {
  const [source, setSource] = useState<SourceType>('home')
  const [listId, setListId] = useState('ai')
  const [handle, setHandle] = useState('paulg')
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

  const initialsFor = useCallback((name: string) => name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(), [])

  const sourceKey = useMemo(() => {
    if (source === 'curated') return 'curated'
    if (source === 'home') return 'home'
    if (source === 'list') return `list:${listId}`
    return `user:${handle.replace('@', '')}`
  }, [source, listId, handle])

  const endpoint = useMemo(() => {
    if (source === 'curated') return '/api/source/curated'
    if (source === 'home') return '/api/source/home'
    if (source === 'list') return `/api/source/list/${listId}`
    return `/api/source/user/${handle.replace('@', '')}`
  }, [source, listId, handle])

  const feedSession = sessions[sourceKey] ?? createPlaybackSession([], 0, defaultCapabilities, '')
  const feedCurrent = feedSession.queue[feedSession.currentIndex]
  const currentQueue = mode === 'thread' ? threadSession.queue : feedSession.queue
  const currentIndex = mode === 'thread' ? threadSession.currentIndex : feedSession.currentIndex
  const current = currentQueue[currentIndex]
  const queue = currentQueue.slice(currentIndex + 1, currentIndex + 7)
  const activeCapabilities = feedSession.capabilities ?? defaultCapabilities
  const activeSourceLabel = mode === 'thread' ? 'Thread' : sourceLabels[source]
  const progress = current ? 0.37 : 0
  const filledBars = Math.floor(waveformHeights.length * progress)
  const initials = current?.authorName ? initialsFor(current.authorName) : 'VA'

  const updateFeedSession = useCallback((key: string, updater: (session: SourcePlaybackSession) => SourcePlaybackSession) => {
    setSessions((prev) => {
      const existing = prev[key] ?? createPlaybackSession([], 0, defaultCapabilities, '')
      return {
        ...prev,
        [key]: updater(existing),
      }
    })
  }, [])

  const updateCurrentFeedSession = useCallback((updater: (session: SourcePlaybackSession) => SourcePlaybackSession) => {
    updateFeedSession(sourceKey, updater)
  }, [sourceKey, updateFeedSession])

  const speakMessage = useCallback((message: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const utter = new SpeechSynthesisUtterance(message)
    utter.rate = rate
    utterRef.current = utter
    window.speechSynthesis.speak(utter)
  }, [rate])

  const announceNotice = useCallback((message: string) => {
    if (!message || typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const utter = new SpeechSynthesisUtterance(message)
    utter.rate = 1
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utter)
  }, [])

  const setCurrentIndex = useCallback((nextIndex: number) => {
    if (mode === 'thread') {
      setThreadSession((prev) => ({ ...prev, currentIndex: Math.max(0, Math.min(nextIndex, prev.queue.length - 1)) }))
      return
    }

    updateCurrentFeedSession((session) => createPlaybackSession(
      session.queue,
      nextIndex,
      session.capabilities,
      session.notice,
      session.cursor,
      session.lastPlayedTweetId,
    ))
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

  const advancePlayback = useCallback(() => {
    if (mode === 'thread') {
      setThreadSession((prev) => ({
        ...prev,
        currentIndex: Math.min(prev.currentIndex + 1, prev.queue.length),
      }))
      return
    }

    updateCurrentFeedSession((session) => ({
      ...session,
      currentIndex: Math.min(session.currentIndex + 1, session.queue.length),
      lastPlayedTweetId: session.queue[session.currentIndex]?.id ?? session.lastPlayedTweetId,
      lastUpdatedAt: new Date().toISOString(),
    }))
  }, [mode, updateCurrentFeedSession])

  const speakCurrent = useCallback(() => {
    if (!current || typeof window === 'undefined' || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()

    const normalizedTweetChunks = narrationChunks(current.text)
    const prefix = mode === 'thread'
      ? `Thread reply ${currentIndex + 1}. From at ${current.authorHandle}.`
      : `From at ${current.authorHandle}.`
    const narration = [prefix, ...normalizedTweetChunks]

    speakChunks(narration, advancePlayback)
  }, [advancePlayback, current, currentIndex, mode, speakChunks])

  const load = useCallback(async () => {
    setState('LOADING')
    const res = await fetch(endpoint)
    const data = (await res.json()) as SourceResponse

    if (!data.canFetchForYou && data.fallbackSource && data.fallbackSource !== source && source === 'home') {
      const fallbackLabel = sourceLabels[data.fallbackSource]
      const fallbackMessage = `${data.statusMessages.fetchForYou} Switched to ${fallbackLabel}.`
      setNotice(fallbackMessage)
      announceNotice(fallbackMessage)
      setSource(data.fallbackSource)
      return
    }

    const priorSession = sessions[sourceKey]
    const recoveredIndex = priorSession?.lastPlayedTweetId
      ? data.items.findIndex((item) => item.id === priorSession.lastPlayedTweetId)
      : -1
    const nextIndex = recoveredIndex >= 0
      ? recoveredIndex
      : Math.min(priorSession?.currentIndex ?? 0, Math.max(data.items.length - 1, 0))
    const unavailableActions: string[] = []
    if (!data.canReply) unavailableActions.push(data.statusMessages.reply)
    if (!data.canLike) unavailableActions.push(data.statusMessages.like)
    const nextNotice = unavailableActions.length > 0 ? unavailableActions.join(' ') : data.statusMessages.source

    updateFeedSession(sourceKey, () => createPlaybackSession(
      data.items,
      nextIndex,
      data.capabilities,
      nextNotice,
      data.nextCursor,
      data.items[nextIndex]?.id ?? priorSession?.lastPlayedTweetId ?? null,
    ))

    setMode('feed')
    setNotice(nextNotice)
    setState('PAUSED')
  }, [announceNotice, endpoint, sessions, source, sourceKey, updateFeedSession])

  const play = useCallback(() => {
    if (!currentQueue.length) return
    setState('PLAYING')
  }, [currentQueue.length])

  const pause = useCallback(() => {
    if (typeof window !== 'undefined') window.speechSynthesis.cancel()
    setState('PAUSED')
  }, [])

  const next = useCallback(() => {
    if (typeof window !== 'undefined') window.speechSynthesis.cancel()
    setCurrentIndex(currentIndex + 1)
  }, [currentIndex, setCurrentIndex])

  const previous = useCallback(() => {
    if (typeof window !== 'undefined') window.speechSynthesis.cancel()
    setCurrentIndex(currentIndex - 1)
  }, [currentIndex, setCurrentIndex])

  const moveQueueItem = useCallback((relativeIndex: number, direction: 'up' | 'down') => {
    if (mode === 'thread') {
      setThreadSession((prev) => {
        const currentAbsolute = prev.currentIndex + 1 + relativeIndex
        const targetAbsolute = direction === 'up' ? currentAbsolute - 1 : currentAbsolute + 1
        if (targetAbsolute < prev.currentIndex + 1 || targetAbsolute >= prev.queue.length) return prev
        const nextQueue = [...prev.queue]
        const temp = nextQueue[currentAbsolute]
        nextQueue[currentAbsolute] = nextQueue[targetAbsolute]
        nextQueue[targetAbsolute] = temp
        return { ...prev, queue: nextQueue }
      })
      return
    }

    updateCurrentFeedSession((session) => {
      const currentAbsolute = session.currentIndex + 1 + relativeIndex
      const targetAbsolute = direction === 'up' ? currentAbsolute - 1 : currentAbsolute + 1
      if (targetAbsolute < session.currentIndex + 1 || targetAbsolute >= session.queue.length) return session
      const nextQueue = [...session.queue]
      const temp = nextQueue[currentAbsolute]
      nextQueue[currentAbsolute] = nextQueue[targetAbsolute]
      nextQueue[targetAbsolute] = temp
      return {
        ...createPlaybackSession(
          nextQueue,
          session.currentIndex,
          session.capabilities,
          session.notice,
          session.cursor,
          session.lastPlayedTweetId,
        ),
        lastUpdatedAt: new Date().toISOString(),
      }
    })
  }, [mode, updateCurrentFeedSession])

  const saveDraftLocally = useCallback((text: string) => {
    if (typeof window === 'undefined') return
    const existing = JSON.parse(localStorage.getItem('vani:replyDrafts') ?? '[]') as Array<{ text: string; createdAt: string }>
    existing.push({ text, createdAt: new Date().toISOString() })
    localStorage.setItem('vani:replyDrafts', JSON.stringify(existing))
  }, [])

  const postReply = useCallback(async (text: string) => {
    if (!activeCapabilities.canReply) {
      speakMessage('Reply is unavailable on the current source.')
      return
    }

    const inReplyTo = mode === 'thread'
      ? threadSession.queue[threadSession.currentIndex]?.id ?? threadSession.rootTweetId
      : current?.id

    try {
      const res = await fetch('/api/tweet/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, inReplyTo }),
      })
      if (!res.ok) throw new Error('Reply API unavailable')
      speakMessage('Reply sent.')
    } catch {
      saveDraftLocally(text)
      speakMessage('Posting API unavailable. Saved draft locally instead.')
    }
  }, [activeCapabilities.canReply, current, mode, saveDraftLocally, speakMessage, threadSession])

  const openThread = useCallback(async () => {
    if (!feedCurrent) {
      speakMessage('No item selected to open thread.')
      return
    }

    setState('LOADING')
    try {
      const res = await fetch(`/api/thread/${feedCurrent.id}`)
      if (!res.ok) throw new Error('Thread API unavailable')
      const data = (await res.json()) as { items: NarrationTweet[] }
      if (!data.items.length) {
        setState('PAUSED')
        speakMessage('No replies found for this thread.')
        return
      }

      setThreadSession({ rootTweetId: feedCurrent.id, queue: data.items, currentIndex: 0 })
      setMode('thread')
      setNotice(`Thread opened for @${feedCurrent.authorHandle}.`)
      setState('PLAYING')
    } catch {
      setState('PAUSED')
      speakMessage('Unable to open thread right now.')
    }
  }, [feedCurrent, speakMessage])

  const exitThreadMode = useCallback(() => {
    if (typeof window !== 'undefined') window.speechSynthesis.cancel()
    setMode('feed')
    setThreadSession({ rootTweetId: null, queue: [], currentIndex: 0 })
    setNotice(feedSession.notice)
    setState('PAUSED')
    speakMessage('Returned to feed.')
  }, [feedSession.notice, speakMessage])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const savedSelection = localStorage.getItem(selectionStorageKey)
      if (savedSelection) {
        const parsed = JSON.parse(savedSelection) as { source?: SourceType; listId?: string; handle?: string }
        if (parsed.source && validSources.includes(parsed.source)) setSource(parsed.source)
        if (parsed.listId) setListId(parsed.listId)
        if (parsed.handle) setHandle(parsed.handle)
      }
    } catch {
      localStorage.removeItem(selectionStorageKey)
    }

    try {
      const rawPersistedState = localStorage.getItem(queueStorageKey)
      if (rawPersistedState) {
        const parsedState = JSON.parse(rawPersistedState) as FeedSessions
        setSessions(parsedState)
      }
    } catch {
      localStorage.removeItem(queueStorageKey)
    }

    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (feedSession.queue.length) {
      setNotice(feedSession.notice)
      setState((existing) => (existing === 'IDLE' ? 'PAUSED' : existing))
      return
    }

    load().catch(() => setState('ERROR'))
  }, [feedSession.notice, feedSession.queue.length, hydrated, load])

  useEffect(() => {
    if (!voiceEnabled || typeof window === 'undefined') return
    const SpeechRecognition = (window as Window & { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition
      || (window as Window & { webkitSpeechRecognition?: any }).webkitSpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.onresult = (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase()

      if (composeState === 'DICTATING') {
        setReplyDraft(transcript)
        setComposeState('CONFIRMING')
        speakMessage(`Draft captured. You said: ${transcript}. Say send to post or cancel to discard.`)
        return
      }

      if (composeState === 'CONFIRMING') {
        const confirmation = parseConfirmation(transcript)
        if (confirmation === 'send') {
          postReply(replyDraft).catch(() => undefined)
          setComposeState('IDLE')
          setReplyDraft('')
        }
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
      if (intent.type === 'SWITCH_SOURCE') {
        setMode('feed')
        setSource(intent.target)
        speakMessage(`Switched source to ${intent.target}.`)
      }
      if (intent.type === 'OPEN_THREAD') {
        openThread().catch(() => undefined)
      }
      if (intent.type === 'NEXT_REPLY') {
        if (mode === 'thread') next()
      }
      if (intent.type === 'BACK_TO_FEED') {
        if (mode === 'thread') exitThreadMode()
      }
      if (intent.type === 'REPLY_TO_THIS') {
        if (!activeCapabilities.canReply) {
          speakMessage('Reply is unavailable on the current source.')
          return
        }
        setComposeState('DICTATING')
        setReplyDraft('')
        speakMessage('Replying to current item. Please dictate your message.')
      }
      if (intent.type === 'REPLY') {
        if (!activeCapabilities.canReply) {
          speakMessage('Reply is unavailable on the current source.')
          return
        }
        setComposeState('DICTATING')
        if (intent.text) {
          setReplyDraft(intent.text)
          setComposeState('CONFIRMING')
          speakMessage(`Draft captured. You said: ${intent.text}. Say send to post or cancel to discard.`)
          return
        }
        setReplyDraft('')
        speakMessage('Reply mode enabled. Please dictate your message.')
      }
    }
    recognition.start()
    return () => recognition.stop()
  }, [activeCapabilities.canReply, composeState, exitThreadMode, mode, next, openThread, pause, play, postReply, replyDraft, speakMessage, voiceEnabled])

  useEffect(() => {
    if (typeof window === 'undefined' || !hydrated) return
    localStorage.setItem(queueStorageKey, JSON.stringify(sessions))
  }, [hydrated, sessions])

  useEffect(() => {
    if (typeof window === 'undefined' || !hydrated) return
    localStorage.setItem(selectionStorageKey, JSON.stringify({ source, listId, handle }))
  }, [handle, hydrated, listId, source])

  useEffect(() => {
    if (state !== 'PLAYING') return
    if (currentIndex >= currentQueue.length) {
      setState('PAUSED')
      return
    }
    speakCurrent()
  }, [currentIndex, currentQueue.length, speakCurrent, state])

  return (
    <>
      <div className="starfield" />
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />
      <div className="signal signal-1" />
      <div className="signal signal-2" />
      <div className="orbital-ring orbital-ring-1" />
      <div className="orbital-ring orbital-ring-2" />
      <main className="shell">
        <div className="topbar">
          <div className="logo">vani</div>
          <button className="avatar-btn" type="button">H</button>
        </div>

        <div className="tagline">receiving signals from earth, tuned for focused listening</div>
        {notice ? <div className="tagline">{notice}</div> : null}

        <div className="source-tabs">
          {sourceTabs.map((tab) => (
            <button key={tab.value} className={`tab ${source === tab.value && mode === 'feed' ? 'active' : ''}`} type="button" onClick={() => { setMode('feed'); setSource(tab.value) }}>
              {tab.label}
            </button>
          ))}
          <button className={`tab ${mode === 'thread' ? 'active' : ''}`} type="button" onClick={() => openThread().catch(() => setState('ERROR'))}>Thread</button>
          <button className="tab" type="button" onClick={() => load().catch(() => setState('ERROR'))}>Refresh</button>
        </div>

        <div className="content-grid">
          <section className="now-playing">
            <div className="np-label"><span className="dot" />Now Playing</div>
            {current ? (
              <>
                <div className="np-author">
                  <div className="np-avatar">
                    {!brokenAvatars[current.authorHandle] ? (
                      <Image src={avatarSrc(current.authorHandle)} alt={`${current.authorName} profile`} width={44} height={44} unoptimized onError={() => setBrokenAvatars((prev) => ({ ...prev, [current.authorHandle]: true }))} />
                    ) : <span>{initials}</span>}
                  </div>
                  <div className="np-meta">
                    <div className="np-name">{current.authorName}</div>
                    <div className="np-handle">@{current.authorHandle} - {activeSourceLabel}</div>
                  </div>
                </div>
                <div className="np-text">{current.text}</div>
              </>
            ) : (
              <div className="np-text">No post loaded yet.</div>
            )}

            <div className="waveform">
              {waveformHeights.map((height, i) => (
                <div key={`${height}-${i}`} className="wave-bar" style={{ height: `${height}%` }}>
                  <div className="fill" style={{ height: i < filledBars ? '100%' : '0%' }} />
                </div>
              ))}
            </div>
            <div className="progress-time"><span>{state === 'PLAYING' ? '0:14' : '0:00'}</span><span>0:38</span></div>
            <div className="source-tabs" style={{ padding: '12px 0 0' }}>
              <button className="tab" type="button" disabled={!activeCapabilities.canLike}>Like</button>
              <button className="tab" type="button" disabled={!activeCapabilities.canReply} onClick={() => { setComposeState('DICTATING'); setReplyDraft(''); speakMessage('Reply mode enabled. Please dictate your message.') }}>Reply</button>
              <button className="tab" type="button" onClick={() => openThread().catch(() => setState('ERROR'))}>Open Thread</button>
              {mode === 'thread' ? <button className="tab" type="button" onClick={exitThreadMode}>Back to Feed</button> : null}
            </div>
            <div className="progress-time" style={{ marginTop: 12 }}>
              <span>Rate limit {activeCapabilities.rateLimitRemaining}</span>
              <span>{mode === 'thread' ? 'Thread mode' : 'Feed mode'}</span>
            </div>
          </section>

          <section>
            <div className="voice-chip"><span className="dot" />{voiceEnabled ? 'Voice listening - say "open thread" or "reply to this"' : 'Voice commands paused'}</div>
            <div className="section-label">Up Next</div>
            <div className="queue-list">
              {queue.map((tweet, i) => {
                const queueInitials = initialsFor(tweet.authorName)
                const queuePosition = currentIndex + i + 1
                return (
                  <button key={tweet.id} className="queue-item" type="button" onClick={() => setCurrentIndex(queuePosition)}>
                    <span className="q-num">{queuePosition + 1}</span>
                    <div className="q-avatar">
                      {!brokenAvatars[tweet.authorHandle] ? (
                        <Image src={avatarSrc(tweet.authorHandle)} alt={`${tweet.authorName} profile`} width={36} height={36} unoptimized onError={() => setBrokenAvatars((prev) => ({ ...prev, [tweet.authorHandle]: true }))} />
                      ) : <span>{queueInitials}</span>}
                    </div>
                    <div className="q-content">
                      <div className="q-name">{tweet.authorName}</div>
                      <div className="q-preview">{tweet.text}</div>
                      <div className="progress-time" style={{ marginTop: 8 }}>
                        <span>#{queuePosition + 1}</span>
                        <span>
                          <button className="tab" type="button" onClick={(event) => { event.stopPropagation(); moveQueueItem(i, 'up') }}>Up</button>
                          <button className="tab" type="button" onClick={(event) => { event.stopPropagation(); moveQueueItem(i, 'down') }}>Down</button>
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      </main>

      <div className="player">
        <div className="player-inner">
          <div className="player-top">
            <div className="player-thumb">
              {current && !brokenAvatars[current.authorHandle] ? (
                <Image src={avatarSrc(current.authorHandle)} alt={`${current.authorName} profile`} width={38} height={38} unoptimized onError={() => setBrokenAvatars((prev) => ({ ...prev, [current.authorHandle]: true }))} />
              ) : <span>{initials}</span>}
            </div>
            <div className="player-meta">
              <div className="player-name">{current?.authorName ?? 'Vani'}</div>
              <div className="player-source">{activeSourceLabel} - {Math.max(currentQueue.length - currentIndex - 1, 0)} left in queue</div>
            </div>
            <button className="speed-btn" type="button" onClick={() => setRate(rates[(rates.indexOf(rate) + 1) % rates.length])}>{rate}x</button>
          </div>
          <div className="player-controls">
            <button className="ctrl-btn" type="button" title="Previous" onClick={previous}>Prev</button>
            <button className="ctrl-btn" type="button" title="Replay" onClick={speakCurrent}>Replay</button>
            <button className="play-btn" type="button" onClick={state === 'PLAYING' ? pause : play}>{state === 'PLAYING' ? 'Pause' : 'Play'}</button>
            <button className="ctrl-btn" type="button" title="Next" onClick={next}>Next</button>
            <button className="ctrl-btn mic-btn" type="button" title="Voice" onClick={() => setVoiceEnabled((v) => !v)}>Mic</button>
          </div>
        </div>
      </div>
    </>
  )
}
