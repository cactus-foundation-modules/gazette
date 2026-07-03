import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionFromCookie } from '@/lib/auth/session'
import { errorResponse } from '@/lib/utils'
import { getGazetteAccess, canEditPost, canDeletePost } from '@/modules/gazette/lib/permissions'
import { getPostById, updatePost, deletePost, setPostTags, getTagIdsForPost } from '@/modules/gazette/lib/db'
import { ensureUniquePostSlug, RESERVED_POST_SLUGS } from '@/modules/gazette/lib/slug'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!access.role && !access.isAdminUser) return errorResponse('Forbidden', 403)

  const { id } = await params
  const post = await getPostById(id)
  if (!post) return errorResponse('Not found', 404)
  if (!canEditPost(access, user.id, post)) return errorResponse('Forbidden', 403)

  const tagIds = await getTagIdsForPost(id)
  return NextResponse.json({ ...post, tagIds })
}

const PatchBody = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  excerpt: z.string().max(500).optional().nullable(),
  builderData: z.any().optional().nullable(),
  featuredImageId: z.string().optional().nullable(),
  authorId: z.string().optional(),
  seriesId: z.string().optional().nullable(),
  seriesOrder: z.number().int().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  seoTitle: z.string().max(60).optional().nullable(),
  seoDescription: z.string().max(160).optional().nullable(),
  canonicalUrl: z.string().optional().nullable(),
  isPinned: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
})

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!access.role && !access.isAdminUser) return errorResponse('Forbidden', 403)

  const { id } = await params
  const post = await getPostById(id)
  if (!post) return errorResponse('Not found', 404)
  if (!canEditPost(access, user.id, post)) return errorResponse('Forbidden', 403)

  const parsed = PatchBody.safeParse(await request.json())
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')
  const { tagIds, authorId, slug, ...rest } = parsed.data

  if (authorId !== undefined && !access.isEditor) {
    return errorResponse('Only editors may reassign the author', 403)
  }

  let finalSlug: string | undefined
  if (slug !== undefined && slug !== post.slug) {
    if (RESERVED_POST_SLUGS.includes(slug)) {
      return errorResponse(`"${slug}" is a reserved path and can't be used as a post slug`, 409)
    }
    finalSlug = await ensureUniquePostSlug(slug, id)
  }

  await updatePost(id, { ...rest, ...(finalSlug ? { slug: finalSlug } : {}), ...(authorId !== undefined ? { authorId } : {}) })
  if (tagIds !== undefined) await setPostTags(id, tagIds)

  return NextResponse.json({ ok: true, slug: finalSlug ?? post.slug })
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!access.role && !access.isAdminUser) return errorResponse('Forbidden', 403)

  const { id } = await params
  const post = await getPostById(id)
  if (!post) return errorResponse('Not found', 404)
  if (!canDeletePost(access, user.id, post)) return errorResponse('Forbidden', 403)

  await deletePost(id)
  return NextResponse.json({ ok: true })
}
