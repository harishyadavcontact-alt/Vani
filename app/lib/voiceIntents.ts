export type VoiceIntentType = 'PLAY' | 'PAUSE' | 'NEXT' | 'SWITCH_SOURCE' | 'REPLY'
export type VoiceSourceTarget = 'home' | 'list' | 'user'

export type VoiceIntent =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'NEXT' }
  | { type: 'SWITCH_SOURCE'; target: VoiceSourceTarget }
  | { type: 'REPLY'; text?: string }

const normalize = (transcript: string) => transcript.toLowerCase().trim()

export function parseVoiceIntent(transcript: string): VoiceIntent | null {
  const normalized = normalize(transcript)
  if (!normalized) return null

  if (/\b(pause|stop)\b/.test(normalized)) return { type: 'PAUSE' }
  if (/\b(play|resume)\b/.test(normalized)) return { type: 'PLAY' }
  if (/\b(skip|next)\b/.test(normalized)) return { type: 'NEXT' }

  if (/\b(switch|change)\b.*\b(home|timeline)\b|\bhome timeline\b/.test(normalized)) {
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

export function parseConfirmation(transcript: string): 'send' | 'edit' | 'cancel' | null {
  const normalized = normalize(transcript)
  if (/\bsend\b/.test(normalized)) return 'send'
  if (/\bedit\b/.test(normalized)) return 'edit'
  if (/\bcancel\b/.test(normalized)) return 'cancel'
  return null
}
