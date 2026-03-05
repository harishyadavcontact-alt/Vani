import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    authenticated: true,
    user: { name: 'Demo User', handle: 'vani_listener' }
  })
}
