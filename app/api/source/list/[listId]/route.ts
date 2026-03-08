import { NextRequest, NextResponse } from 'next/server'
import { getListSourceResponse } from '@/lib/server/services/source-service'

export async function GET(_req: NextRequest, { params }: { params: { listId: string } }) {
  return NextResponse.json(getListSourceResponse(params.listId))
}
