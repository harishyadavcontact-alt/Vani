import { NextResponse } from 'next/server'
import { getAuthContext } from '@/app/lib/auth'
import type { MeResponse } from '@/app/lib/types'
import { getBootstrappedState } from '@/lib/server/services/bootstrap-service'

export async function GET() {
  const auth = await getAuthContext()
  const appState = await getBootstrappedState()

  const response: MeResponse = {
    authenticated: auth.isAuthenticated,
    mode: auth.mode,
    sessionState: auth.sessionState,
    provider: auth.provider,
    providerConnected: auth.providerConnected,
    hasOAuthTokens: auth.hasOAuthTokens,
    capabilities: {
      canUseDemo: auth.canUseDemo,
      canConnectX: auth.canConnectX,
      canPostReplies: auth.canPostReplies,
    },
    user: auth.user,
    appState,
  }

  return NextResponse.json(response)
}
