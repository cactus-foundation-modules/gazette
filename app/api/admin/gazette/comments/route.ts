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
  // Clamped and NaN-proofed: a mistyped page number reached listComments as
  // NaN, and (NaN - 1) * perPage is an OFFSET no query can run - a 500 where
  // page one is the only sensible answer. Page 0 would go negative likewise.
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10) || 1)

  const { comments, total } = await listComments({ status, page, perPage: 25 })
  return NextResponse.json({ comments, total })
}
