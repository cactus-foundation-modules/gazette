import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/auth/session'
import { errorResponse } from '@/lib/utils'
import { getGazetteAccess } from '@/modules/gazette/lib/permissions'
import { listUsersForPicker } from '@/modules/gazette/lib/db'

export async function GET(request: NextRequest) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!access.isEditor) return errorResponse('Forbidden', 403)

  const q = request.nextUrl.searchParams.get('q') ?? undefined
  const users = await listUsersForPicker(q)
  return NextResponse.json({ users })
}
