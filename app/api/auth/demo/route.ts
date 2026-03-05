import { NextResponse } from 'next/server'
import { isDemoModeEnabled, setAuthState } from '@/app/lib/auth'

export async function GET(request: Request) {
  if (!isDemoModeEnabled()) {
    return NextResponse.json(
      { error: 'Demo mode is disabled. Set DEMO_MODE=true to enable this flow.' },
      { status: 400 }
    )
  }

  await setAuthState('guest')
  return NextResponse.redirect(new URL('/', request.url))
}
