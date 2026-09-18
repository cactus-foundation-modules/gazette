import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { errorResponse } from '@/lib/utils'
import { getClientIp } from '@/lib/auth/rate-limit'
import { allowRequest } from '@/modules/gazette/lib/memory-rate-limit'
import { recordView, isPostPubliclyVisible } from '@/modules/gazette/lib/db'

const Body = z.object({ postId: z.string(), visitorToken: z.string().min(1).max(64) })

export async function POST(request: NextRequest) {
  if (!allowRequest(`gz_view:${await getClientIp()}`, 60, 60_000)) return errorResponse('Too many requests', 429)
  const parsed = Body.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')

  if (!(await isPostPubliclyVisible(parsed.data.postId))) return errorResponse('Post not found', 404)

  await recordView(parsed.data.postId, parsed.data.visitorToken)
  return NextResponse.json({ ok: true })
}
