import { NextResponse } from 'next/server'
import type { PublicListenRequest } from '@/app/lib/types'
import { getAnonymousPublicSourceResponse } from '@/lib/server/services/source-service'

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as PublicListenRequest | null
  const response = await getAnonymousPublicSourceResponse({
    input: body?.input ?? '',
  })

  const status =
    response.status === 'invalid_source'
      ? 400
      : response.status === 'temporary_failure'
        ? 503
        : 200

  return NextResponse.json(response, { status })
}
