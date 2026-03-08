import { NextResponse } from 'next/server'

type DraftRecord = {
  id: string
  body: string
  createdAt: string
  status: 'draft'
}

const draftStore: DraftRecord[] = []

export async function GET() {
  return NextResponse.json({ items: draftStore })
}

export async function POST(request: Request) {
  const body = (await request.json()) as { body?: string }

  if (!body.body?.trim()) {
    return NextResponse.json({ error: 'Draft body is required' }, { status: 400 })
  }

  const draft: DraftRecord = {
    id: `draft-${Date.now()}`,
    body: body.body.trim(),
    createdAt: new Date().toISOString(),
    status: 'draft',
  }

  draftStore.unshift(draft)
  return NextResponse.json(draft, { status: 201 })
}
