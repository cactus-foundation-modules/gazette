import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionFromCookie } from '@/lib/auth/session'
import { errorResponse } from '@/lib/utils'
import { getGazetteAccess } from '@/modules/gazette/lib/permissions'
import { getGazetteSettings, updateGazetteSettings } from '@/modules/gazette/lib/settings'

export async function GET() {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!access.isEditor) return errorResponse('Forbidden', 403)

  const settings = await getGazetteSettings()
  return NextResponse.json(settings)
}

const Body = z.object({
  postsPerPage: z.number().int().min(1).max(100).optional(),
  rssEnabled: z.boolean().optional(),
  feedTitle: z.string().max(200).optional().nullable(),
  feedDescription: z.string().max(500).optional().nullable(),
  commentsEnabled: z.boolean().optional(),
  commentsVisibility: z.enum(['PUBLIC', 'MEMBERS_ONLY']).optional(),
  commentModeration: z.enum(['PRE', 'POST']).optional(),
  commentsThreaded: z.boolean().optional(),
  reactionsEnabled: z.boolean().optional(),
  reactionSet: z.array(z.string()).optional(),
  showViewCounts: z.boolean().optional(),
  postUrlStyle: z.enum(['PREFIXED', 'ROOT']).optional(),
})

export async function PATCH(request: NextRequest) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!access.isEditor) return errorResponse('Forbidden', 403)

  const parsed = Body.safeParse(await request.json())
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')

  const settings = await updateGazetteSettings(parsed.data)
  return NextResponse.json(settings)
}
