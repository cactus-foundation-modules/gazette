import { NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/auth/session'
import { isAdmin } from '@/lib/permissions/check'
import { errorResponse } from '@/lib/utils'
import { listUserRoles } from '@/modules/gazette/lib/db'

// Admin-only (Decision 4) - gazette editors, even though they can manage
// everything else, cannot assign or remove gazette roles.
export async function GET() {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  if (!isAdmin(user)) return errorResponse('Forbidden', 403)

  const roles = await listUserRoles()
  return NextResponse.json({ roles })
}
