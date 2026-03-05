import { NextResponse } from 'next/server'
import { getAuthState, isDemoModeEnabled } from '@/app/lib/auth'

const guestUser = { name: 'Guest Listener', handle: 'guest' }
const connectedUser = { name: 'Demo User', handle: 'vani_listener' }

export async function GET() {
  const authState = await getAuthState()
  const inDemoMode = isDemoModeEnabled()

  if (authState === 'connected') {
    return NextResponse.json({
      authenticated: true,
      mode: inDemoMode ? 'demo' : 'oauth',
      provider: 'x',
      user: connectedUser
    })
  }

  if (authState === 'guest' && inDemoMode) {
    return NextResponse.json({
      authenticated: false,
      mode: 'demo',
      provider: null,
      user: guestUser
    })
  }

  return NextResponse.json({
    authenticated: false,
    mode: inDemoMode ? 'demo' : 'oauth',
    provider: null,
    user: inDemoMode ? guestUser : null
  })
}
