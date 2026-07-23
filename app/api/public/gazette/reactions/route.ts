import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { errorResponse } from '@/lib/utils'
import { toggleReaction, getReactionCounts, isPostPubliclyVisible } from '@/modules/gazette/lib/db'
import { getGazetteSettings, DEFAULT_REACTION_SET } from '@/modules/gazette/lib/settings'

const Body = z.object({ postId: z.string(), emoji: z.string().min(1).max(8), visitorToken: z.string().min(1) })

export async function POST(request: NextRequest) {
  const parsed = Body.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')
  const { postId, emoji, visitorToken } = parsed.data

  if (!(await isPostPubliclyVisible(postId))) return errorResponse('Post not found', 404)

  const settings = await getGazetteSettings()
  if (!settings.reactionsEnabled) return errorResponse('Reactions are disabled', 403)

  const allowed = settings.reactionSet ?? DEFAULT_REACTION_SET
  if (!allowed.includes(emoji)) return errorResponse('Unknown reaction')

  const active = await toggleReaction(postId, emoji, visitorToken)
  const counts = await getReactionCounts(postId)

  return NextResponse.json({ ok: true, active, counts })
}
