import { NextRequest, NextResponse } from 'next/server'
import { LIST_TWEETS } from '@/app/lib/mockData'

export async function GET(_req: NextRequest, { params }: { params: { listId: string } }) {
  const items = LIST_TWEETS[params.listId] ?? []
  return NextResponse.json({ items, nextCursor: null })
}
