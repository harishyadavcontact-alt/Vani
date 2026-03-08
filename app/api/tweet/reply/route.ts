import { NextResponse } from 'next/server'
import { getAuthContext } from '@/app/lib/auth'
import { OAuthTokenExpiredError, createReplyTweet, XPostFailedError, XRateLimitError } from '@/app/lib/xClient'

type ReplyRequest = {
  text?: string
  inReplyTo?: string
}

export async function POST(request: Request) {
  const auth = await getAuthContext()
  if (!auth.canPostReplies) {
    return NextResponse.json(
      {
        error: 'AUTH_REQUIRED',
        message: 'Connect your X account before posting replies.',
        auth: {
          mode: auth.mode,
          sessionState: auth.sessionState,
          provider: auth.provider,
        },
      },
      { status: 401 },
    )
  }

  const body = (await request.json().catch(() => null)) as ReplyRequest | null
  const text = body?.text?.trim()
  const inReplyTo = body?.inReplyTo?.trim()

  if (!text || !inReplyTo) {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        message: 'Both text and inReplyTo are required.',
      },
      { status: 400 },
    )
  }

  if (auth.mode === 'demo') {
    return NextResponse.json({
      ok: true,
      replyId: `demo-${Date.now()}`,
    })
  }

  try {
    const result = await createReplyTweet(text, inReplyTo)
    return NextResponse.json({
      ok: true,
      replyId: result.data?.id ?? null,
    })
  } catch (error) {
    if (error instanceof OAuthTokenExpiredError) {
      return NextResponse.json(
        {
          error: 'AUTH_EXPIRED',
          message: error.message,
          reason: error.reason,
        },
        { status: 401 },
      )
    }

    if (error instanceof XRateLimitError) {
      return NextResponse.json(
        {
          error: 'RATE_LIMITED',
          message: 'X API rate limit hit. Please wait and try again.',
        },
        { status: 429 },
      )
    }

    if (error instanceof XPostFailedError) {
      return NextResponse.json(
        {
          error: 'POST_FAILED',
          message: error.message,
        },
        { status: 502 },
      )
    }

    return NextResponse.json(
      {
        error: 'UNKNOWN',
        message: 'Unexpected failure while posting reply.',
      },
      { status: 500 },
    )
  }
}
