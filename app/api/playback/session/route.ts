import { NextResponse } from 'next/server'
import { getBootstrappedState } from '@/lib/server/services/bootstrap-service'

export async function GET() {
  const state = await getBootstrappedState()
  return NextResponse.json(state.playback)
}
