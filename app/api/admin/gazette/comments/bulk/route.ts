import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionFromCookie } from '@/lib/auth/session'
import { errorResponse } from '@/lib/utils'
import { getGazetteAccess } from '@/modules/gazette/lib/permissions'
import { bulkUpdateComments } from '@/modules/gazette/lib/db'

const Body = z.object({ action: z.enum(['approve', 'reject', 'delete']), ids: z.array(z.string()).min(1).max(200) })

export async function POST(request: NextRequest) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!access.isEditor) return errorResponse('Forbidden', 403)

  const parsed = Body.safeParse(await request.json())
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')

  await bulkUpdateComments(parsed.data.ids, parsed.data.action)
  return NextResponse.json({ ok: true })
}
