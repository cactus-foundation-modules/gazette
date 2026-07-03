import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionFromCookie } from '@/lib/auth/session'
import { errorResponse } from '@/lib/utils'
import { getGazetteAccess } from '@/modules/gazette/lib/permissions'
import { getCommentById, createComment } from '@/modules/gazette/lib/db'

type Params = { params: Promise<{ id: string }> }

const Body = z.object({ body: z.string().min(1).max(5000) })

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!access.isEditor) return errorResponse('Forbidden', 403)

  const { id } = await params
  const target = await getCommentById(id)
  if (!target) return errorResponse('Not found', 404)

  const parsed = Body.safeParse(await request.json())
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')

  // One level of replies enforced: replying to a reply attaches to its parent.
  const parentId = target.parentId ?? target.id

  const comment = await createComment({
    postId: target.postId,
    parentId,
    authorName: user.displayName ?? user.username,
    authorEmail: user.email,
    authorUserId: user.id,
    body: parsed.data.body,
    status: 'APPROVED',
    ipAddress: null,
  })

  return NextResponse.json(comment, { status: 201 })
}
