import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionFromCookie } from '@/lib/auth/session'
import { isAdmin } from '@/lib/permissions/check'
import { errorResponse } from '@/lib/utils'
import { setUserRole, removeUserRole } from '@/modules/gazette/lib/db'

type Params = { params: Promise<{ userId: string }> }

const Body = z.object({ role: z.enum(['GAZETTE_CONTRIBUTOR', 'GAZETTE_AUTHOR', 'GAZETTE_EDITOR']) })

export async function PUT(request: NextRequest, { params }: Params) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  if (!isAdmin(user)) return errorResponse('Forbidden', 403)

  const { userId } = await params
  const parsed = Body.safeParse(await request.json())
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')

  await setUserRole(userId, parsed.data.role, user.id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  if (!isAdmin(user)) return errorResponse('Forbidden', 403)

  const { userId } = await params
  await removeUserRole(userId)
  return NextResponse.json({ ok: true })
}
