import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionFromCookie } from '@/lib/auth/session'
import { errorResponse } from '@/lib/utils'
import { getGazetteAccess, canViewGazetteAdmin } from '@/modules/gazette/lib/permissions'
import { getAuthorProfile, upsertAuthorProfile } from '@/modules/gazette/lib/db'

type Params = { params: Promise<{ userId: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!canViewGazetteAdmin(access)) return errorResponse('Forbidden', 403)

  const { userId } = await params
  const profile = await getAuthorProfile(userId)
  return NextResponse.json({ profile })
}

const Body = z.object({ bio: z.string().max(2000).optional().nullable(), avatarId: z.string().optional().nullable() })

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!canViewGazetteAdmin(access)) return errorResponse('Forbidden', 403)

  const { userId } = await params
  if (!access.isEditor && userId !== user.id) return errorResponse('Forbidden', 403)

  const parsed = Body.safeParse(await request.json())
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')

  await upsertAuthorProfile(userId, parsed.data)
  return NextResponse.json({ ok: true })
}
