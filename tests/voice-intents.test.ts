import { describe, expect, it } from 'vitest'
import { parseVoiceIntent } from '@/app/lib/voiceIntents'

describe('parseVoiceIntent', () => {
  it('detects curated source switching', () => {
    expect(parseVoiceIntent('switch to for you')).toEqual({ type: 'SWITCH_SOURCE', target: 'curated' })
  })

  it('detects open thread', () => {
    expect(parseVoiceIntent('open thread')).toEqual({ type: 'OPEN_THREAD' })
  })

  it('detects reply with inline draft', () => {
    expect(parseVoiceIntent('reply sounds good')).toEqual({ type: 'REPLY', text: 'sounds good' })
  })
})
