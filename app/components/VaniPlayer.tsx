'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { NarrationTweet, SourceType } from '@/app/lib/types'

type FeedResponse = { items: NarrationTweet[] }
type PlayerState = 'IDLE' | 'LOADING' | 'PLAYING' | 'PAUSED' | 'ERROR'

const rates = [1, 1.25, 1.5, 2]

export default function VaniPlayer() {
  const [source, setSource] = useState<SourceType>('home')
  const [listId, setListId] = useState('builders')
  const [handle, setHandle] = useState('openai')
  const [tweets, setTweets] = useState<NarrationTweet[]>([])
  const [index, setIndex] = useState(0)
  const [state, setState] = useState<PlayerState>('IDLE')
  const [rate, setRate] = useState(1)
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

  const endpoint = useMemo(() => {
    if (source === 'home') return '/api/source/home'
    if (source === 'list') return `/api/source/list/${listId}`
    return `/api/source/user/${handle.replace('@', '')}`
  }, [source, listId, handle])

  const speakCurrent = useCallback(() => {
    const current = tweets[index]
    if (!current || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return
    }
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(`From @${current.authorHandle}. ${current.text}`)
    utter.rate = rate
    utter.onend = () => {
      setIndex((i) => i + 1)
    }
    utter.onerror = () => setState('ERROR')
    utterRef.current = utter
    window.speechSynthesis.speak(utter)
  }, [tweets, index, rate])

  const load = useCallback(async () => {
    setState('LOADING')
    const res = await fetch(endpoint)
    const data = (await res.json()) as FeedResponse
    setTweets(data.items)
    setIndex(0)
    setState('PAUSED')
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
    localStorage.setItem('vani:lastSource', source)
    localStorage.setItem('vani:lastTweetIndex', String(index))
  }, [source, index])

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
