import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { errorResponse } from '@/lib/utils'
import { getSessionFromCookie } from '@/lib/auth/session'
import { verifyTurnstile } from '@/lib/auth/turnstile'
import { getVisiblePostBySlug, getCommentById, checkCommentRateLimit, createComment } from '@/modules/gazette/lib/db'
import { getGazetteSettings } from '@/modules/gazette/lib/settings'
import { prisma } from '@/lib/db/prisma'

const Body = z.object({
  postId: z.string(),
  parentId: z.string().optional().nullable(),
  authorName: z.string().min(1).max(100),
  authorEmail: z.string().email(),
  body: z.string().min(1).max(5000),
  'cf-turnstile-response': z.string().optional(),
})

function getClientIp(request: NextRequest): string | null {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
}

export async function POST(request: NextRequest) {
  const parsed = Body.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')
  const { postId, parentId, authorName, authorEmail, body } = parsed.data

  const post = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "gz_posts" WHERE "id" = ${postId} AND (
      ("status" = 'PUBLISHED' AND "published_at" <= NOW()) OR ("status" = 'SCHEDULED' AND "scheduled_for" <= NOW())
    ) AND "is_private" = false LIMIT 1
  `
  if (!post[0]) return errorResponse('Post not found', 404)

  const settings = await getGazetteSettings()
  if (!settings.commentsEnabled) return errorResponse('Comments are disabled for this post', 403)

  let authorUserId: string | null = null
  if (settings.commentsVisibility === 'MEMBERS_ONLY') {
    const user = await getSessionFromCookie()
    if (!user) return errorResponse('Only members can comment.', 403)
    authorUserId = user.id
  }

  const ok = await verifyTurnstile(parsed.data['cf-turnstile-response'])
  if (!ok) return errorResponse('Verification failed', 403)

  const ip = getClientIp(request)
  if (ip && !(await checkCommentRateLimit(ip))) {
    return errorResponse('Too many comments - please wait a few minutes and try again', 429)
  }

  let finalParentId: string | null = null
  if (parentId) {
    if (!settings.commentsThreaded) return errorResponse('Replies are disabled')
    const parent = await getCommentById(parentId)
    if (!parent || parent.postId !== postId || parent.status !== 'APPROVED' || parent.parentId) {
      return errorResponse('Cannot reply to this comment')
    }
    finalParentId = parentId
  }

  const status = settings.commentModeration === 'PRE' ? 'PENDING' : 'APPROVED'

  await createComment({
    postId, parentId: finalParentId, authorName, authorEmail, authorUserId, body, status, ipAddress: ip,
  })

  return NextResponse.json({
    ok: true,
    message: status === 'PENDING' ? 'Thank you. Your comment is awaiting moderation.' : 'Your comment has been posted.',
  })
}
