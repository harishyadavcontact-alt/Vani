import { NextResponse } from 'next/server'
import { isDemoModeEnabled, setAuthState } from '@/app/lib/auth'

export async function GET(request: Request) {
  if (isDemoModeEnabled()) {
    await setAuthState('connected')
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.json({
    message: 'OAuth stub: connect X app credentials here.',
    demoModeAvailable: false
  })
}
