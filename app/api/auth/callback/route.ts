import { NextResponse } from 'next/server'
import { isDemoModeEnabled, setAuthState, setOAuthUserTokens } from '@/app/lib/auth'

export async function GET(request: Request) {
  if (isDemoModeEnabled()) {
    await setAuthState('connected')
    return NextResponse.redirect(new URL('/', request.url))
  }

  const url = new URL(request.url)
  const accessToken = url.searchParams.get('access_token')
  const refreshToken = url.searchParams.get('refresh_token')
  const expiresIn = Number(url.searchParams.get('expires_in') ?? '')

  if (!accessToken) {
    return NextResponse.json(
      { error: 'Missing access_token in callback query for OAuth stub.' },
      { status: 400 }
    )
  }

  await setAuthState('connected')
  await setOAuthUserTokens({
    accessToken,
    refreshToken,
    expiresAt: Number.isFinite(expiresIn) ? Date.now() + expiresIn * 1000 : null
  })

  return NextResponse.redirect(new URL('/', request.url))
}
