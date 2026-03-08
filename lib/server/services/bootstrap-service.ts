import type { BootstrappedAppState } from '@/lib/domain/entities'
import { getDemoBootstrap, getDemoThread } from './demo-data'
import { ensureAudioAsset } from './tts-service'

export async function getBootstrappedState(): Promise<BootstrappedAppState> {
  const state = getDemoBootstrap()
  await Promise.all(state.queue.slice(0, 3).map((item) => ensureAudioAsset(item.feedItem)))
  return state
}

export async function getThreadByExternalId(externalId: string) {
  return getDemoThread(externalId)
}
