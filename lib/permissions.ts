import { prisma } from '@/lib/db/prisma'
import { isAdmin } from '@/lib/permissions/check'
import type { SessionUser } from '@/lib/auth/session'
import type { GazetteAccess, GazetteRole } from './types'

export async function getGazetteAccess(user: SessionUser): Promise<GazetteAccess> {
  const isAdminUser = isAdmin(user)

  const rows = await prisma.$queryRaw<Array<{ role: GazetteRole }>>`
    SELECT "role" FROM "gz_user_roles" WHERE "user_id" = ${user.id} LIMIT 1
  `
  const role = rows[0]?.role ?? null

  return { role, isEditor: isAdminUser || role === 'GAZETTE_EDITOR', isAdminUser }
}

export function canViewGazetteAdmin(a: GazetteAccess): boolean {
  return a.isAdminUser || a.role !== null
}

type PostOwnership = { authorId: string | null; status: string }

export function canEditPost(a: GazetteAccess, userId: string, post: PostOwnership): boolean {
  if (a.isEditor) return true
  if (post.authorId !== userId) return false
  if (a.role === 'GAZETTE_AUTHOR') return true
  if (a.role === 'GAZETTE_CONTRIBUTOR') return post.status === 'DRAFT'
  return false
}

export function canPublishPost(a: GazetteAccess, userId: string, post: PostOwnership): boolean {
  if (a.isEditor) return true
  return a.role === 'GAZETTE_AUTHOR' && post.authorId === userId
}

export function canDeletePost(a: GazetteAccess, userId: string, post: PostOwnership): boolean {
  return canEditPost(a, userId, post)
}

// Role assignment is admin-only (Decision 4) - intentionally does not accept
// GazetteAccess/isEditor. Guard call sites with isAdmin(user) directly.
export function isGazetteEditor(a: GazetteAccess): boolean {
  return a.isEditor
}
