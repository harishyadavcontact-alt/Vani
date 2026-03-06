'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { narrationChunks } from '@/app/lib/narration'
import type { NarrationTweet, SourceType } from '@/app/lib/types'
import { parseConfirmation, parseVoiceIntent } from '@/app/lib/voiceIntents'

type FeedResponse = { items: NarrationTweet[] }
type PlayerState = 'IDLE' | 'LOADING' | 'PLAYING' | 'PAUSED' | 'ERROR'
type ComposeState = 'IDLE' | 'DICTATING' | 'CONFIRMING'
type Mode = 'feed' | 'thread'
type FeedSessionSnapshot = {
  tweets: NarrationTweet[]
  index: number
  state: PlayerState
}

const rates = [1, 1.25, 1.5, 2]

export default function VaniPlayer() {
  const [source, setSource] = useState<SourceType>('curated')
  const [listId, setListId] = useState('builders')
  const [handle, setHandle] = useState('openai')
  const [tweets, setTweets] = useState<NarrationTweet[]>([])
  const [index, setIndex] = useState(0)
  const [state, setState] = useState<PlayerState>('IDLE')
  const [rate, setRate] = useState(1)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [composeState, setComposeState] = useState<ComposeState>('IDLE')
  const [replyDraft, setReplyDraft] = useState('')
  const [mode, setMode] = useState<Mode>('feed')
  const [threadRootTweetId, setThreadRootTweetId] = useState<string | null>(null)
  const [threadReplyTarget, setThreadReplyTarget] = useState<NarrationTweet | null>(null)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)
  const feedSessionRef = useRef<FeedSessionSnapshot | null>(null)

  const speakMessage = useCallback((message: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const utter = new SpeechSynthesisUtterance(message)
    utter.rate = rate
    utterRef.current = utter
    window.speechSynthesis.speak(utter)
  }, [rate])

  const endpoint = useMemo(() => {
    if (source === 'curated') return '/api/source/curated'
    if (source === 'home') return '/api/source/home'
    if (source === 'list') return `/api/source/list/${listId}`
    return `/api/source/user/${handle.replace('@', '')}`
  }, [source, listId, handle])

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
    const current = tweets[index]
    if (!current || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return
    }

    window.speechSynthesis.cancel()

    const normalizedTweetChunks = narrationChunks(current.text)
    const preface = mode === 'thread' ? `Thread reply ${index + 1}. From at ${current.authorHandle}.` : `From at ${current.authorHandle}.`
    const narration = [preface, ...normalizedTweetChunks]

    speakChunks(narration, () => {
      setIndex((i) => i + 1)
    })
  }, [tweets, index, mode, speakChunks])

  const load = useCallback(async () => {
    setState('LOADING')
    const res = await fetch(endpoint)
    const data = (await res.json()) as FeedResponse
    setTweets(data.items)
    setIndex(0)
    setState('PAUSED')
    setMode('feed')
    setThreadRootTweetId(null)
    setThreadReplyTarget(null)
    feedSessionRef.current = null
  }, [endpoint])

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
    setIndex((i) => Math.min(i + 1, tweets.length - 1))
  }, [tweets.length])

  const openThread = useCallback(async () => {
    const current = tweets[index]
    if (!current) {
      speakMessage('No tweet selected to open thread.')
      return
    }

    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel()
    }

    const feedSnapshot: FeedSessionSnapshot = {
      tweets,
      index,
      state,
    }

    setState('LOADING')
    try {
      const res = await fetch(`/api/thread/${current.id}`)
      if (!res.ok) throw new Error('Thread API unavailable')
      const data = (await res.json()) as FeedResponse
      if (!data.items.length) {
        setState(feedSnapshot.state)
        speakMessage('No replies found for this thread.')
        return
      }

      feedSessionRef.current = feedSnapshot
      setMode('thread')
      setThreadRootTweetId(current.id)
      setThreadReplyTarget(data.items[0] ?? null)
      setTweets(data.items)
      setIndex(0)
      setState('PLAYING')
      speakMessage('Thread opened. Available commands are next reply, reply to this, and back to feed.')
    } catch {
      setState(feedSnapshot.state)
      speakMessage('Unable to open thread right now.')
    }
  }, [index, speakMessage, state, tweets])

  const exitThreadMode = useCallback(() => {
    const snapshot = feedSessionRef.current
    if (!snapshot) {
      setMode('feed')
      setThreadRootTweetId(null)
      setThreadReplyTarget(null)
      return
    }

    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel()
    }

    setMode('feed')
    setThreadRootTweetId(null)
    setThreadReplyTarget(null)
    setTweets(snapshot.tweets)
    setIndex(snapshot.index)
    setState(snapshot.state)
    feedSessionRef.current = null
    speakMessage('Returned to feed.')
  }, [speakMessage])

  const nextReply = useCallback(() => {
    if (mode !== 'thread') {
      speakMessage('Open a thread first.')
      return
    }

    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel()
    }

    setIndex((i) => {
      const nextIndex = Math.min(i + 1, tweets.length - 1)
      setThreadReplyTarget(tweets[nextIndex] ?? null)
      return nextIndex
    })
    setState('PLAYING')
  }, [mode, speakMessage, tweets])

  const saveDraftLocally = useCallback((text: string) => {
    if (typeof window === 'undefined') return
    const existing = JSON.parse(localStorage.getItem('vani:replyDrafts') ?? '[]') as Array<{ text: string; createdAt: string }>
    existing.push({ text, createdAt: new Date().toISOString() })
    localStorage.setItem('vani:replyDrafts', JSON.stringify(existing))
  }, [])

  const postReply = useCallback(async (text: string) => {
    const inReplyTo = threadReplyTarget?.id ?? tweets[index]?.id ?? threadRootTweetId ?? null

    try {
      const res = await fetch('/api/reply', {
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
  }, [index, saveDraftLocally, speakMessage, threadReplyTarget, threadRootTweetId, tweets])

  useEffect(() => {
    load().catch(() => setState('ERROR'))
  }, [load])

  useEffect(() => {
    if (mode === 'thread') {
      setThreadReplyTarget(tweets[index] ?? null)
    }
  }, [index, mode, tweets])

  useEffect(() => {
    if (state !== 'PLAYING') return
    if (index >= tweets.length) {
      setState('PAUSED')
      return
    }
    speakCurrent()
  }, [state, index, tweets.length, speakCurrent])

  useEffect(() => {
    if (!voiceEnabled || typeof window === 'undefined') return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.onresult = (event: any) => {
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
      if (intent.type === 'OPEN_THREAD') {
        openThread().catch(() => undefined)
      }
      if (intent.type === 'NEXT_REPLY') {
        nextReply()
      }
      if (intent.type === 'BACK_TO_FEED') {
        exitThreadMode()
      }
      if (intent.type === 'REPLY_TO_THIS') {
        setComposeState('DICTATING')
        setReplyDraft('')
        speakMessage('Replying to current thread item. Please dictate your message.')
      }
      if (intent.type === 'SWITCH_SOURCE') {
        setSource(intent.target)
        speakMessage(`Switched source to ${intent.target}.`)
      }
      if (intent.type === 'REPLY') {
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
  }, [voiceEnabled, pause, play, next, openThread, nextReply, exitThreadMode, composeState, postReply, replyDraft, speakMessage])

  useEffect(() => {
    localStorage.setItem('vani:lastSource', source)
    localStorage.setItem('vani:lastTweetIndex', String(index))
  }, [source, index])

  return (
    <div className="card">
      <h2>Tune-In</h2>
      <div className="source-grid">
        <button className={source === 'curated' ? 'primary' : ''} onClick={() => setSource('curated')}>Curated</button>
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
        <div className="small">Mode: {mode}{threadRootTweetId ? ` (${threadRootTweetId})` : ''}</div>
        <div className="small">Voice Reply: {composeState}{replyDraft ? ` — "${replyDraft}"` : ''}</div>
        <div className="controls" style={{ marginTop: '.5rem' }}>
          <button className="primary" onClick={play}>Play</button>
          <button onClick={pause}>Pause</button>
          <button onClick={next}>Next</button>
          <button onClick={() => openThread().catch(() => setState('ERROR'))}>Open Thread</button>
          <button onClick={nextReply}>Next Reply</button>
          <button onClick={exitThreadMode}>Back to Feed</button>
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
