import { NextRequest, NextResponse } from 'next/server'
import { getUserSourceResponse } from '@/lib/server/services/source-service'

export async function GET(_req: NextRequest, { params }: { params: { handle: string } }) {
  return NextResponse.json(getUserSourceResponse(params.handle))
}
