import { NextResponse } from 'next/server'
import { clearAuthState, clearOAuthUserTokens, getAuthContext, setAuthState } from '@/app/lib/auth'

export async function GET(request: Request) {
  const auth = await getAuthContext()

  if (auth.mode !== 'demo') {
    await clearAuthState()
    await clearOAuthUserTokens()
    return NextResponse.json(
      {
        error: 'DEMO_MODE_DISABLED',
        message: 'Demo mode is disabled. Set DEMO_MODE=true to enable this flow.',
        auth: {
          mode: auth.mode,
          sessionState: 'signed_out',
          provider: auth.provider,
        },
      },
      { status: 400 },
    )
  }

  await setAuthState('guest')
  await clearOAuthUserTokens()
  return NextResponse.redirect(new URL('/', request.url))
}
