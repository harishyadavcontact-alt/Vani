import { NextResponse } from 'next/server'
import { getQueue } from '@/lib/server/services/queue-service'

export async function GET() {
  return NextResponse.json({ items: await getQueue() })
}
