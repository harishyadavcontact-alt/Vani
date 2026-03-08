import { NextResponse } from 'next/server'
import { hasDatabase } from '@/lib/server/env'

export async function GET() {
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    services: {
      database: hasDatabase() ? 'configured' : 'demo',
      app: 'ready',
      audio: 'browser-fallback',
    },
  })
}
