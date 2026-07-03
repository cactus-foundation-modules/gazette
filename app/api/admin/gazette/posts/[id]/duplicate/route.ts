import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/auth/session'
import { errorResponse } from '@/lib/utils'
import { getGazetteAccess, canEditPost, canViewGazetteAdmin } from '@/modules/gazette/lib/permissions'
import { getPostById, createPost, updatePost, getTagIdsForPost, setPostTags } from '@/modules/gazette/lib/db'
import { slugifyTitle, ensureUniquePostSlug } from '@/modules/gazette/lib/slug'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!canViewGazetteAdmin(access)) return errorResponse('Forbidden', 403)

  const { id } = await params
  const source = await getPostById(id)
  if (!source) return errorResponse('Not found', 404)
  if (!canEditPost(access, user.id, source)) return errorResponse('Forbidden', 403)

  const title = `Copy of ${source.title}`
  const slug = await ensureUniquePostSlug(slugifyTitle(title))
  const created = await createPost({ title, slug, authorId: user.id, templateBuilderData: source.builderData })

  await updatePost(created.id, {
    excerpt: source.excerpt,
    featuredImageId: source.featuredImageId,
    seoTitle: source.seoTitle,
    seoDescription: source.seoDescription,
    canonicalUrl: source.canonicalUrl,
  })

  const tagIds = await getTagIdsForPost(id)
  if (tagIds.length > 0) await setPostTags(created.id, tagIds)

  return NextResponse.json(created, { status: 201 })
}
