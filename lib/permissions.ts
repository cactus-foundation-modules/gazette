import { hasPermissions, isAdmin } from '@/lib/permissions/check'
import type { SessionUser } from '@/lib/auth/session'
import type { GazetteAccess } from './types'

export async function getGazetteAccess(user: SessionUser): Promise<GazetteAccess> {
  const isAdminUser = isAdmin(user)
  const perms = await hasPermissions(user, ['gazette.editor', 'gazette.author', 'gazette.contributor'])

  return {
    isAdminUser,
    isEditor: isAdminUser || !!perms['gazette.editor'],
    isAuthor: !!perms['gazette.author'],
    isContributor: !!perms['gazette.contributor'],
  }
}

export function canViewGazetteAdmin(a: GazetteAccess): boolean {
  return a.isEditor || a.isAuthor || a.isContributor
}

type PostOwnership = { authorId: string | null; status: string }

export function canEditPost(a: GazetteAccess, userId: string, post: PostOwnership): boolean {
  if (a.isEditor) return true
  if (post.authorId !== userId) return false
  if (a.isAuthor) return true
  if (a.isContributor) return post.status === 'DRAFT'
  return false
}

export function canPublishPost(a: GazetteAccess, userId: string, post: PostOwnership): boolean {
  if (a.isEditor) return true
  return a.isAuthor && post.authorId === userId
}

export function canDeletePost(a: GazetteAccess, userId: string, post: PostOwnership): boolean {
  return canEditPost(a, userId, post)
}
