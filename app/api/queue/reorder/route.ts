import { NextResponse } from 'next/server'
import { reorderQueue } from '@/lib/server/services/queue-service'

export async function POST(request: Request) {
  const body = (await request.json()) as { itemId?: string; direction?: 'up' | 'down' }

  if (!body.itemId || !body.direction) {
    return NextResponse.json({ error: 'itemId and direction are required' }, { status: 400 })
  }

  return NextResponse.json({
    items: await reorderQueue(body.itemId, body.direction),
  })
}
