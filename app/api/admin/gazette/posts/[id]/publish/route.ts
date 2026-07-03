import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionFromCookie } from '@/lib/auth/session'
import { errorResponse } from '@/lib/utils'
import { getGazetteAccess, canPublishPost, canViewGazetteAdmin } from '@/modules/gazette/lib/permissions'
import { getPostById, publishPost } from '@/modules/gazette/lib/db'

type Params = { params: Promise<{ id: string }> }

const Body = z.object({
  action: z.enum(['publish', 'schedule', 'unpublish']),
  scheduledFor: z.string().datetime().optional(),
})

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!canViewGazetteAdmin(access)) return errorResponse('Forbidden', 403)

  const { id } = await params
  const post = await getPostById(id)
  if (!post) return errorResponse('Not found', 404)
  if (!canPublishPost(access, user.id, post)) return errorResponse('Forbidden', 403)

  const parsed = Body.safeParse(await request.json())
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')
  const { action, scheduledFor } = parsed.data

  if (action === 'schedule') {
    if (!scheduledFor) return errorResponse('scheduledFor is required to schedule a post')
    const when = new Date(scheduledFor)
    if (when.getTime() <= Date.now()) return errorResponse('Scheduled time must be in the future')
    await publishPost(id, 'schedule', when)
  } else {
    await publishPost(id, action)
  }

  return NextResponse.json({ ok: true })
}
