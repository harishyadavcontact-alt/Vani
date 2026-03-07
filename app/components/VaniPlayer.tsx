'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { narrationChunks } from '@/app/lib/narration'
import type { NarrationTweet, SourceResponse, SourceType } from '@/app/lib/types'
import { parseConfirmation, parseVoiceIntent } from '@/app/lib/voiceIntents'

type PlayerState = 'IDLE' | 'LOADING' | 'PLAYING' | 'PAUSED' | 'ERROR'
type ComposeState = 'IDLE' | 'DICTATING' | 'CONFIRMING'

const rates = [1, 1.25, 1.5, 2]
const waveformHeights = [30, 50, 70, 45, 80, 60, 35, 75, 55, 40, 65, 85, 50, 30, 70, 60, 40, 80, 55, 45, 75, 35, 60, 90, 50, 40, 70, 55, 80, 65]

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

export default function VaniPlayer() {
  const [source, setSource] = useState<SourceType>('home')
  const [listId] = useState('ai')
  const [handle] = useState('paulg')
  const [tweets, setTweets] = useState<NarrationTweet[]>([])
  const [index, setIndex] = useState(0)
  const [state, setState] = useState<PlayerState>('IDLE')
  const [rate, setRate] = useState(1.25)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [composeState, setComposeState] = useState<ComposeState>('IDLE')
  const [replyDraft, setReplyDraft] = useState('')
  const [brokenAvatars, setBrokenAvatars] = useState<Record<string, boolean>>({})
  const [notice, setNotice] = useState('')
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

  const initialsFor = useCallback((name: string) => name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase(), [])

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
    if (!current || typeof window === 'undefined' || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()

    const normalizedTweetChunks = narrationChunks(current.text)
    const narration = [`From at ${current.authorHandle}.`, ...normalizedTweetChunks]

    speakChunks(narration, () => {
      setIndex((i) => i + 1)
    })
  }, [tweets, index, speakChunks])

  const load = useCallback(async () => {
    setState('LOADING')
    const res = await fetch(endpoint)
    const data = (await res.json()) as SourceResponse

    if (!data.canFetchForYou && data.fallbackSource && data.fallbackSource !== source) {
      const fallbackLabel = sourceLabels[data.fallbackSource]
      const fallbackMessage = `${data.statusMessages.fetchForYou} Switched to ${fallbackLabel}.`
      setNotice(fallbackMessage)
      announceNotice(fallbackMessage)
      setSource(data.fallbackSource)
      return
    }

    const unavailableActions: string[] = []
    if (!data.canReply) unavailableActions.push(data.statusMessages.reply)
    if (!data.canLike) unavailableActions.push(data.statusMessages.like)

    setNotice(unavailableActions.length > 0 ? unavailableActions.join(' ') : data.statusMessages.source)
    setTweets(data.items)
    setIndex(0)
    setState('PAUSED')
  }, [announceNotice, endpoint, source])

  const play = useCallback(() => {
    if (!tweets.length) return
    setState('PLAYING')
  }, [tweets.length])

  const pause = useCallback(() => {
    if (typeof window !== 'undefined') window.speechSynthesis.cancel()
    setState('PAUSED')
  }, [])

  const next = useCallback(() => {
    if (typeof window !== 'undefined') window.speechSynthesis.cancel()
    setIndex((i) => Math.min(i + 1, tweets.length - 1))
  }, [tweets.length])

  const previous = useCallback(() => {
    if (typeof window !== 'undefined') window.speechSynthesis.cancel()
    setIndex((i) => Math.max(i - 1, 0))
  }, [])

  const saveDraftLocally = useCallback((text: string) => {
    if (typeof window === 'undefined') return
    const existing = JSON.parse(localStorage.getItem('vani:replyDrafts') ?? '[]') as Array<{ text: string; createdAt: string }>
    existing.push({ text, createdAt: new Date().toISOString() })
    localStorage.setItem('vani:replyDrafts', JSON.stringify(existing))
  }, [])

  const postReply = useCallback(async (text: string) => {
    try {
      const res = await fetch('/api/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, inReplyTo: tweets[index]?.id ?? null }),
      })
      if (!res.ok) throw new Error('Reply API unavailable')
      speakMessage('Reply sent.')
    } catch {
      saveDraftLocally(text)
      speakMessage('Posting API unavailable. Saved draft locally instead.')
    }
  }, [index, saveDraftLocally, speakMessage, tweets])

  useEffect(() => {
    load().catch(() => setState('ERROR'))
  }, [load])

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
  }, [voiceEnabled, pause, play, next, composeState, postReply, replyDraft, speakMessage])

  const current = tweets[index]
  const queue = tweets.slice(index + 1, index + 7)
  const progress = current ? 0.37 : 0
  const filledBars = Math.floor(waveformHeights.length * progress)
  const initials = current?.authorName ? initialsFor(current.authorName) : 'VA'

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
            <button key={tab.value} className={`tab ${source === tab.value ? 'active' : ''}`} type="button" onClick={() => setSource(tab.value)}>
              {tab.label}
            </button>
          ))}
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
                    <div className="np-handle">@{current.authorHandle} - {sourceLabels[source]}</div>
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
          </section>

          <section>
            <div className="voice-chip"><span className="dot" />{voiceEnabled ? 'Voice listening - say "skip" or "like this"' : 'Voice commands paused'}</div>
            <div className="section-label">Up Next</div>
            <div className="queue-list">
              {queue.map((tweet, i) => {
                const queueInitials = initialsFor(tweet.authorName)
                return (
                  <button key={tweet.id} className="queue-item" type="button" onClick={() => setIndex(index + i + 1)}>
                    <span className="q-num">{index + i + 2}</span>
                    <div className="q-avatar">
                      {!brokenAvatars[tweet.authorHandle] ? (
                        <Image src={avatarSrc(tweet.authorHandle)} alt={`${tweet.authorName} profile`} width={36} height={36} unoptimized onError={() => setBrokenAvatars((prev) => ({ ...prev, [tweet.authorHandle]: true }))} />
                      ) : <span>{queueInitials}</span>}
                    </div>
                    <div className="q-content">
                      <div className="q-name">{tweet.authorName}</div>
                      <div className="q-preview">{tweet.text}</div>
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
              <div className="player-source">{sourceTabs.find((tab) => tab.value === source)?.label} - {Math.max(tweets.length - index - 1, 0)} left in queue</div>
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
