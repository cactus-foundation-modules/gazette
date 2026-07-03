import { NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/auth/session'
import { errorResponse } from '@/lib/utils'
import { getGazetteAccess } from '@/modules/gazette/lib/permissions'
import { listAuthors } from '@/modules/gazette/lib/db'

export async function GET() {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!access.role && !access.isAdminUser) return errorResponse('Forbidden', 403)

  const authors = await listAuthors()
  return NextResponse.json({ authors })
}
