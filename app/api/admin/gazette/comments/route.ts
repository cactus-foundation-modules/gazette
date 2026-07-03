import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/auth/session'
import { errorResponse } from '@/lib/utils'
import { getGazetteAccess } from '@/modules/gazette/lib/permissions'
import { listComments } from '@/modules/gazette/lib/db'

export async function GET(request: NextRequest) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!access.isEditor) return errorResponse('Forbidden', 403)

  const sp = request.nextUrl.searchParams
  const status = sp.get('status') ?? 'all'
  const page = parseInt(sp.get('page') ?? '1', 10)

  const { comments, total } = await listComments({ status, page, perPage: 25 })
  return NextResponse.json({ comments, total })
}
