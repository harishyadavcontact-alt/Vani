'use client'

import { useState, useTransition } from 'react'

export function useReplyComposer() {
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'sent' | 'error'>('idle')
  const [isPending, startTransition] = useTransition()

  function send(inReplyTo: string | null) {
    startTransition(async () => {
      try {
        if (!draft.trim() || !inReplyTo) {
          setStatus('error')
          return
        }

        setStatus('saving')
        const response = await fetch('/api/tweet/reply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: draft, inReplyTo }),
        })

        if (!response.ok) throw new Error('Reply failed')

        setStatus('sent')
        setDraft('')
      } catch {
        setStatus('error')
      }
    })
  }

  return {
    draft,
    setDraft,
    status,
    isReplyPending: isPending,
    send,
  }
}
