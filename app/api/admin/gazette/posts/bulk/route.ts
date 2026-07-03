import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionFromCookie } from '@/lib/auth/session'
import { errorResponse } from '@/lib/utils'
import { getGazetteAccess, canDeletePost } from '@/modules/gazette/lib/permissions'
import { getPostById, bulkDeletePosts } from '@/modules/gazette/lib/db'

const Body = z.object({ action: z.literal('delete'), ids: z.array(z.string()).min(1).max(200) })

export async function POST(request: NextRequest) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!access.role && !access.isAdminUser) return errorResponse('Forbidden', 403)

  const parsed = Body.safeParse(await request.json())
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')
  const { ids } = parsed.data

  const allowed: string[] = []
  const forbidden: string[] = []
  for (const id of ids) {
    const post = await getPostById(id)
    if (!post) continue
    if (canDeletePost(access, user.id, post)) allowed.push(id)
    else forbidden.push(id)
  }

  await bulkDeletePosts(allowed)
  return NextResponse.json({ ok: true, deleted: allowed.length, forbidden })
}
