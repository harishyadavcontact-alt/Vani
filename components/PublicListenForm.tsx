'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { recentPublicSourcesEvent, readRecentPublicSources, type RecentPublicSource } from '@/lib/client/public-source-history'
import { buildPublicListenHref } from '@/lib/client/public-listen'

type Props = {
  initialValue?: string
  compact?: boolean
}

const examples = [
  { label: 'Paste post URL', value: 'https://x.com/naval/status/1234567890' },
  { label: 'Try a handle', value: '@paulg' },
  { label: 'Try a public list', value: 'https://x.com/i/lists/1' },
]

export function PublicListenForm({ initialValue = '', compact = false }: Props) {
  const router = useRouter()
  const [value, setValue] = useState(initialValue)
  const [recentSources, setRecentSources] = useState<RecentPublicSource[]>([])

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const syncRecentSources = () => setRecentSources(readRecentPublicSources())

    syncRecentSources()
    window.addEventListener(recentPublicSourcesEvent, syncRecentSources)
    window.addEventListener('storage', syncRecentSources)

    return () => {
      window.removeEventListener(recentPublicSourcesEvent, syncRecentSources)
      window.removeEventListener('storage', syncRecentSources)
    }
  }, [])

  function submit(nextValue: string) {
    router.push(buildPublicListenHref(nextValue))
  }

  return (
    <div className={`public-listen ${compact ? 'compact' : ''}`}>
      <div className="public-listen-copy">
        <div className="panel-kicker">Listen First</div>
        <h3>Paste a public X source and start without login.</h3>
        <p>Use a post URL, handle, or public list. Login comes later for save, sync, and reply.</p>
      </div>
      <form
        className="public-listen-form"
        onSubmit={(event) => {
          event.preventDefault()
          submit(value)
        }}
      >
        <input
          className="public-listen-input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Paste a public X URL, @handle, or list"
        />
        <button type="submit" className="cta">Listen now</button>
      </form>
      <div className="public-listen-examples">
        {examples.map((example) => (
          <button
            key={example.label}
            type="button"
            className="mini-pill"
            onClick={() => {
              setValue(example.value)
              submit(example.value)
            }}
          >
            {example.label}
          </button>
        ))}
      </div>
      {recentSources.length ? (
        <div className="public-listen-recents">
          <div className="panel-kicker">Recent Sources</div>
          <div className="public-listen-examples">
            {recentSources.map((recent) => (
              <button
                key={`${recent.kind}-${recent.input}`}
                type="button"
                className="mini-pill"
                onClick={() => {
                  setValue(recent.input)
                  submit(recent.input)
                }}
              >
                {recent.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
