'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { narrationChunks } from '@/app/lib/narration'
import type { NarrationTweet, SourceType } from '@/app/lib/types'
import { parseConfirmation, parseVoiceIntent } from '@/app/lib/voiceIntents'
import { AppShell } from './signal-listener/AppShell'
import { BottomPlayer } from './signal-listener/BottomPlayer'
import { NowPlayingCard } from './signal-listener/NowPlayingCard'
import { QueueList } from './signal-listener/QueueList'
import { SourceTabs } from './signal-listener/SourceTabs'
import { TopBar } from './signal-listener/TopBar'
import { quickVoiceHints, rates, sourceTabs, waveformHeights } from './signal-listener/constants'
import styles from './signal-listener/SignalListener.module.css'
import type { SignalAction, SignalItem, SourceTabOption } from './signal-listener/types'

type FeedResponse = { items: NarrationTweet[] }
type PlayerState = 'IDLE' | 'LOADING' | 'PLAYING' | 'PAUSED' | 'ERROR'
type ComposeState = 'IDLE' | 'DICTATING' | 'CONFIRMING'

export default function VaniPlayer() {
  const [source, setSource] = useState<SourceType>('home')
  const [activeTabId, setActiveTabId] = useState('x')
  const [listId, setListId] = useState('builders')
  const [handle, setHandle] = useState('paulg')
  const [tweets, setTweets] = useState<NarrationTweet[]>([])
  const [queueOrder, setQueueOrder] = useState<string[]>([])
  const [index, setIndex] = useState(0)
  const [state, setState] = useState<PlayerState>('IDLE')
  const [rate, setRate] = useState(1.25)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [composeState, setComposeState] = useState<ComposeState>('IDLE')
  const [replyDraft, setReplyDraft] = useState('')
  const [brokenAvatars, setBrokenAvatars] = useState<Record<string, boolean>>({})
  const [actionFeedback, setActionFeedback] = useState('')
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

  const endpoint = useMemo(() => {
    if (source === 'curated') return '/api/source/curated'
    if (source === 'home') return '/api/source/home'
    if (source === 'list') return `/api/source/list/${listId}`
    return `/api/source/user/${handle.replace('@', '')}`
  }, [source, listId, handle])

  const tweetById = useMemo(() => Object.fromEntries(tweets.map((t) => [t.id, t])), [tweets])
  const orderedTweets = useMemo(
    () => queueOrder.map((id) => tweetById[id]).filter((tweet): tweet is NarrationTweet => Boolean(tweet)),
    [queueOrder, tweetById],
  )

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
    const current = orderedTweets[index]
    if (!current || typeof window === 'undefined' || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()

    const normalizedTweetChunks = narrationChunks(current.text)
    const narration = [`From at ${current.authorHandle}.`, ...normalizedTweetChunks]

    speakChunks(narration, () => {
      setIndex((i) => i + 1)
    })
  }, [orderedTweets, index, speakChunks])

  const load = useCallback(async () => {
    setState('LOADING')
    const res = await fetch(endpoint)
    const data = (await res.json()) as FeedResponse
    setTweets(data.items)
    setQueueOrder(data.items.map((item) => item.id))
    setIndex(0)
    setState('PAUSED')
  }, [endpoint])

  const play = useCallback(() => {
    if (!orderedTweets.length) return
    setState('PLAYING')
  }, [orderedTweets.length])

  const pause = useCallback(() => {
    if (typeof window !== 'undefined') window.speechSynthesis.cancel()
    setState('PAUSED')
  }, [])

  const next = useCallback(() => {
    if (typeof window !== 'undefined') window.speechSynthesis.cancel()
    setIndex((i) => Math.min(i + 1, orderedTweets.length - 1))
  }, [orderedTweets.length])

  const previous = useCallback(() => {
    if (typeof window !== 'undefined') window.speechSynthesis.cancel()
    setIndex((i) => Math.max(i - 1, 0))
  }, [])

  const moveQueueItem = useCallback((relativeIndex: number, direction: 'up' | 'down') => {
    const currentAbsolute = index + 1 + relativeIndex
    const targetAbsolute = direction === 'up' ? currentAbsolute - 1 : currentAbsolute + 1

    setQueueOrder((prev) => {
      if (targetAbsolute < index + 1 || targetAbsolute >= prev.length) return prev
      const nextOrder = [...prev]
      const temp = nextOrder[currentAbsolute]
      nextOrder[currentAbsolute] = nextOrder[targetAbsolute]
      nextOrder[targetAbsolute] = temp
      return nextOrder
    })
  }, [index])

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
        body: JSON.stringify({ text, inReplyTo: orderedTweets[index]?.id ?? null }),
      })
      if (!res.ok) throw new Error('Reply API unavailable')
      speakMessage('Reply sent.')
    } catch {
      saveDraftLocally(text)
      speakMessage('Posting API unavailable. Saved draft locally instead.')
    }
  }, [index, orderedTweets, saveDraftLocally, speakMessage])

  const onSignalAction = useCallback((action: SignalAction) => {
    const labels: Record<SignalAction, string> = {
      save: 'Saved to your signal library.',
      summarize: 'Summary queued: key takeaways will play next.',
      expand: 'Expanded context queued with supporting links.',
      remix: 'Contrarian remix generated for this signal.',
      share: 'Share link copied to clipboard.',
    }
    setActionFeedback(labels[action])
  }, [])

  const onSelectTab = (tab: SourceTabOption) => {
    setActiveTabId(tab.id)
    setSource(tab.source)
    if (tab.listId) setListId(tab.listId)
    if (tab.handle) setHandle(tab.handle)
  }

  useEffect(() => {
    load().catch(() => setState('ERROR'))
  }, [load])

  useEffect(() => {
    if (state !== 'PLAYING') return
    if (index >= orderedTweets.length) {
      setState('PAUSED')
      return
    }
    speakCurrent()
  }, [state, index, orderedTweets.length, speakCurrent])

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
        const matched = sourceTabs.find((tab) => tab.source === intent.target)
        if (matched) setActiveTabId(matched.id)
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

  useEffect(() => {
    if (!actionFeedback) return
    const timeout = setTimeout(() => setActionFeedback(''), 2600)
    return () => clearTimeout(timeout)
  }, [actionFeedback])

  const sourceLabel = sourceTabs.find((tab) => tab.id === activeTabId)?.label ?? 'Following'
  const current = orderedTweets[index]
  const progress = current ? 0.37 : 0
  const queue = orderedTweets.slice(index + 1, index + 6).map((tweet) => ({
    ...tweet,
    sourceLabel,
    relativeTime: 'Just now',
  })) as SignalItem[]
  const signalItem = current ? ({ ...current, sourceLabel, relativeTime: 'Now' } as SignalItem) : undefined
  const initials = current?.authorName ? initialsFor(current.authorName) : 'VA'

  return (
    <AppShell>
      <TopBar profileInitial="H" />
      <SourceTabs tabs={sourceTabs} activeId={activeTabId} onSelect={onSelectTab} />

      <div>
        <NowPlayingCard
          item={signalItem}
          sourceLabel={sourceLabel}
          progress={progress}
          waveformHeights={waveformHeights}
          stateLabel={state}
          brokenAvatars={brokenAvatars}
          onBrokenAvatar={(h) => setBrokenAvatars((prev) => ({ ...prev, [h]: true }))}
          initialsFor={initialsFor}
          onAction={onSignalAction}
        />
        <div className={styles.hintStrip}>
          {quickVoiceHints.map((hint) => <div key={hint} className={styles.hint}>{hint}</div>)}
        </div>
        {actionFeedback ? <div className={styles.hintStrip}><div className={styles.hint}>{actionFeedback}</div></div> : null}
      </div>

      <QueueList
        items={queue}
        startIndex={index}
        brokenAvatars={brokenAvatars}
        onBrokenAvatar={(h) => setBrokenAvatars((prev) => ({ ...prev, [h]: true }))}
        onSelect={setIndex}
        initialsFor={initialsFor}
        onMoveQueueItem={moveQueueItem}
      />

      <BottomPlayer
        item={signalItem}
        sourceLabel={sourceLabel}
        queueLeft={Math.max(orderedTweets.length - index - 1, 0)}
        progress={progress}
        isPlaying={state === 'PLAYING'}
        rate={rate}
        brokenAvatars={brokenAvatars}
        onBrokenAvatar={(h) => setBrokenAvatars((prev) => ({ ...prev, [h]: true }))}
        initials={initials}
        onPrevious={previous}
        onPlayPause={state === 'PLAYING' ? pause : play}
        onNext={next}
        onRate={() => setRate(rates[(rates.indexOf(rate) + 1) % rates.length])}
      />
    </AppShell>
  )
}
