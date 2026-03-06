'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { NarrationTweet, SourceType } from '@/app/lib/types'

type FeedResponse = { items: NarrationTweet[]; cursor?: string | null }
type PlayerState = 'IDLE' | 'LOADING' | 'PLAYING' | 'PAUSED' | 'ERROR'
type SourceSession = {
  queue: NarrationTweet[]
  currentIndex: number
  cursor?: string | null
  lastPlayedItemId?: string | null
}

type SessionsMap = Record<string, SourceSession>

const rates = [1, 1.25, 1.5, 2]
const SESSIONS_STORAGE_KEY = 'vani:sourceSessions'
const SELECTION_STORAGE_KEY = 'vani:sourceSelection'

const emptySession = (): SourceSession => ({
  queue: [],
  currentIndex: 0,
  cursor: null,
  lastPlayedItemId: null,
})

const normalizeSession = (session: SourceSession): SourceSession => {
  const safeIndex = session.queue.length ? Math.min(Math.max(session.currentIndex, 0), session.queue.length) : 0
  const activeItem = session.queue[safeIndex]
  return {
    queue: session.queue,
    currentIndex: safeIndex,
    cursor: session.cursor ?? null,
    lastPlayedItemId: activeItem?.id ?? session.lastPlayedItemId ?? null,
  }
}

export default function VaniPlayer() {
  const [source, setSource] = useState<SourceType>('home')
  const [listId, setListId] = useState('builders')
  const [handle, setHandle] = useState('openai')
  const [sessions, setSessions] = useState<SessionsMap>({})
  const [hydrated, setHydrated] = useState(false)
  const [state, setState] = useState<PlayerState>('IDLE')
  const [rate, setRate] = useState(1)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

  const sessionKey = useMemo(() => {
    if (source === 'home') return 'following'
    if (source === 'list') return `lists:${listId}`
    return 'curated'
  }, [source, listId])

  const endpoint = useMemo(() => {
    if (source === 'home') return '/api/source/home'
    if (source === 'list') return `/api/source/list/${listId}`
    return `/api/source/user/${handle.replace('@', '')}`
  }, [source, listId, handle])

  const currentSession = sessions[sessionKey] ?? emptySession()
  const tweets = currentSession.queue
  const index = currentSession.currentIndex

  const updateCurrentSession = useCallback((updater: (session: SourceSession) => SourceSession) => {
    setSessions((prev) => {
      const existing = prev[sessionKey] ?? emptySession()
      return {
        ...prev,
        [sessionKey]: normalizeSession(updater(existing)),
      }
    })
  }, [sessionKey])

  const speakCurrent = useCallback(() => {
    const current = tweets[index]
    if (!current || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return
    }
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(`From @${current.authorHandle}. ${current.text}`)
    utter.rate = rate
    utter.onend = () => {
      updateCurrentSession((session) => ({
        ...session,
        currentIndex: Math.min(session.currentIndex + 1, session.queue.length),
        lastPlayedItemId: current.id,
      }))
    }
    utter.onerror = () => setState('ERROR')
    utterRef.current = utter
    window.speechSynthesis.speak(utter)
  }, [tweets, index, rate, updateCurrentSession])

  const load = useCallback(async () => {
    setState('LOADING')
    const res = await fetch(endpoint)
    const data = (await res.json()) as FeedResponse

    updateCurrentSession((existing) => {
      const recoveredIndex = existing.lastPlayedItemId
        ? data.items.findIndex((item) => item.id === existing.lastPlayedItemId)
        : -1
      const nextIndex = recoveredIndex >= 0
        ? recoveredIndex
        : Math.min(existing.currentIndex, Math.max(data.items.length - 1, 0))
      const currentItem = data.items[nextIndex]
      return {
        queue: data.items,
        currentIndex: nextIndex,
        cursor: data.cursor ?? existing.cursor ?? null,
        lastPlayedItemId: currentItem?.id ?? existing.lastPlayedItemId ?? null,
      }
    })

    setState('PAUSED')
  }, [endpoint, updateCurrentSession])

  const play = useCallback(() => {
    if (!tweets.length) return
    setState('PLAYING')
  }, [tweets.length])

  const pause = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel()
    }
    setState('PAUSED')
  }, [])

  const next = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel()
    }
    updateCurrentSession((session) => {
      const nextIndex = Math.min(session.currentIndex + 1, session.queue.length)
      return {
        ...session,
        currentIndex: nextIndex,
        lastPlayedItemId: session.queue[nextIndex]?.id ?? session.lastPlayedItemId ?? null,
      }
    })
  }, [updateCurrentSession])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      const savedSelection = window.localStorage.getItem(SELECTION_STORAGE_KEY)
      if (savedSelection) {
        const parsed = JSON.parse(savedSelection) as { source?: SourceType; listId?: string; handle?: string }
        if (parsed.source) setSource(parsed.source)
        if (parsed.listId) setListId(parsed.listId)
        if (parsed.handle) setHandle(parsed.handle)
      }
    } catch {
      // Ignore corrupt localStorage values.
    }

    try {
      const savedSessions = window.localStorage.getItem(SESSIONS_STORAGE_KEY)
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions) as SessionsMap
        const normalized: SessionsMap = Object.fromEntries(
          Object.entries(parsed).map(([key, value]) => [key, normalizeSession(value)])
        )
        setSessions(normalized)
      }
    } catch {
      // Ignore corrupt localStorage values.
    }

    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (tweets.length) {
      setState((existing) => (existing === 'IDLE' ? 'PAUSED' : existing))
      return
    }
    load().catch(() => setState('ERROR'))
  }, [hydrated, tweets.length, load])

  useEffect(() => {
    if (!voiceEnabled || typeof window === 'undefined') return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase()
      if (transcript.includes('pause')) pause()
      if (transcript.includes('play') || transcript.includes('resume')) play()
      if (transcript.includes('skip') || transcript.includes('next')) next()
    }
    recognition.start()
    return () => recognition.stop()
  }, [voiceEnabled, pause, play, next])

  useEffect(() => {
    if (typeof window === 'undefined' || !hydrated) return
    window.localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions))
  }, [sessions, hydrated])

  useEffect(() => {
    if (typeof window === 'undefined' || !hydrated) return
    window.localStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify({ source, listId, handle }))
  }, [source, listId, handle, hydrated])

  useEffect(() => {
    if (state !== 'PLAYING') return
    if (index >= tweets.length) {
      setState('PAUSED')
      return
    }
    speakCurrent()
  }, [state, index, tweets.length, speakCurrent])

  return (
    <div className="card">
      <h2>Tune-In</h2>
      <div className="source-grid">
        <button className={source === 'home' ? 'primary' : ''} onClick={() => setSource('home')}>Home Timeline</button>
        <button className={source === 'list' ? 'primary' : ''} onClick={() => setSource('list')}>List</button>
        <button className={source === 'user' ? 'primary' : ''} onClick={() => setSource('user')}>User</button>
        {source === 'list' && (
          <select value={listId} onChange={(e) => setListId(e.target.value)}>
            <option value="builders">Builders</option>
            <option value="ai">AI</option>
          </select>
        )}
        {source === 'user' && <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@handle" />}
        <button onClick={() => load().catch(() => setState('ERROR'))}>Refresh Feed</button>
      </div>

      <div className="card">
        <div className="small">State: {state}</div>
        <div className="controls" style={{ marginTop: '.5rem' }}>
          <button className="primary" onClick={play}>Play</button>
          <button onClick={pause}>Pause</button>
          <button onClick={next}>Next</button>
          <select value={rate} onChange={(e) => setRate(Number(e.target.value))}>
            {rates.map((r) => <option key={r} value={r}>{r}x</option>)}
          </select>
          <button onClick={() => setVoiceEnabled((v) => !v)}>{voiceEnabled ? 'Disable Voice Cmds' : 'Enable Voice Cmds'}</button>
        </div>
      </div>

      <div className="card">
        <h3>Now Playing</h3>
        {tweets[index] ? (
          <div className="tweet now">
            <strong>@{tweets[index].authorHandle}</strong>
            <p>{tweets[index].text}</p>
          </div>
        ) : (
          <p className="small">No tweet loaded.</p>
        )}
      </div>

      <div className="card">
        <h3>Queue</h3>
        {tweets.map((t, i) => (
          <div key={t.id} className={`tweet ${i === index ? 'now' : ''}`}>
            <strong>@{t.authorHandle}</strong>
            <p>{t.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
