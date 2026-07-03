import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { errorResponse } from '@/lib/utils'
import { recordView } from '@/modules/gazette/lib/db'

const Body = z.object({ postId: z.string(), visitorToken: z.string().min(1) })

export async function POST(request: NextRequest) {
  const parsed = Body.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')

  await recordView(parsed.data.postId, parsed.data.visitorToken)
  return NextResponse.json({ ok: true })
}
