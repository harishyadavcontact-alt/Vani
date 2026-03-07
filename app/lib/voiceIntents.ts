export type VoiceIntentType =
  | 'PLAY'
  | 'PAUSE'
  | 'NEXT'
  | 'SWITCH_SOURCE'
  | 'REPLY'
  | 'OPEN_THREAD'
  | 'NEXT_REPLY'
  | 'BACK_TO_FEED'
  | 'REPLY_TO_THIS'
export type VoiceSourceTarget = 'curated' | 'home' | 'list' | 'user'

export type VoiceIntent =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'NEXT' }
  | { type: 'SWITCH_SOURCE'; target: VoiceSourceTarget }
  | { type: 'REPLY'; text?: string }
  | { type: 'OPEN_THREAD' }
  | { type: 'NEXT_REPLY' }
  | { type: 'BACK_TO_FEED' }
  | { type: 'REPLY_TO_THIS' }

const normalize = (transcript: string) => transcript.toLowerCase().trim()

export function parseVoiceIntent(transcript: string): VoiceIntent | null {
  const normalized = normalize(transcript)
  if (!normalized) return null

  if (/\b(pause|stop)\b/.test(normalized)) return { type: 'PAUSE' }
  if (/\b(play|resume)\b/.test(normalized)) return { type: 'PLAY' }
  if (/\b(skip|next)\b/.test(normalized)) return { type: 'NEXT' }
  if (/\b(open|show|read)\b.*\bthread\b|\bopen thread\b/.test(normalized)) return { type: 'OPEN_THREAD' }
  if (/\bnext reply\b/.test(normalized)) return { type: 'NEXT_REPLY' }
  if (/\bback to feed\b|\bexit thread\b/.test(normalized)) return { type: 'BACK_TO_FEED' }
  if (/\breply to this\b/.test(normalized)) return { type: 'REPLY_TO_THIS' }

  if (/\b(switch|change)\b.*\b(curated|for you)\b|\bfor you\b/.test(normalized)) {
    return { type: 'SWITCH_SOURCE', target: 'curated' }
  }
  if (/\b(switch|change)\b.*\b(home|timeline|following)\b|\bhome timeline\b/.test(normalized)) {
    return { type: 'SWITCH_SOURCE', target: 'home' }
  }
  if (/\b(switch|change)\b.*\blist\b|\bto list\b/.test(normalized)) {
    return { type: 'SWITCH_SOURCE', target: 'list' }
  }
  if (/\b(switch|change)\b.*\buser\b|\bto user\b/.test(normalized)) {
    return { type: 'SWITCH_SOURCE', target: 'user' }
  }

  if (/^reply\b/.test(normalized)) {
    const text = normalized.replace(/^reply\s*/, '').trim()
    return text ? { type: 'REPLY', text } : { type: 'REPLY' }
  }

  return null
}

export function parseConfirmation(transcript: string): 'send' | 'cancel' | null {
  const normalized = normalize(transcript)
  if (/\bsend\b/.test(normalized)) return 'send'
  if (/\bcancel\b/.test(normalized)) return 'cancel'
  return null
}
