import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionFromCookie } from '@/lib/auth/session'
import { errorResponse } from '@/lib/utils'
import { getGazetteAccess, canViewGazetteAdmin } from '@/modules/gazette/lib/permissions'
import { listPostsAdmin, normaliseScheduledPosts, createPost, getTemplateById, getTagsForPosts } from '@/modules/gazette/lib/db'
import { slugifyTitle, ensureUniquePostSlug } from '@/modules/gazette/lib/slug'
import type { PostsTab } from '@/modules/gazette/lib/db'
import { prisma } from '@/lib/db/prisma'

const VALID_TABS = ['all', 'drafts', 'published', 'scheduled', 'pinned', 'private']

export async function GET(request: NextRequest) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!canViewGazetteAdmin(access)) return errorResponse('Forbidden', 403)

  await normaliseScheduledPosts()

  const sp = request.nextUrl.searchParams
  const tabParam = sp.get('tab') ?? 'all'
  const tab = (VALID_TABS.includes(tabParam) ? tabParam : 'all') as PostsTab
  const q = sp.get('q') ?? undefined
  const page = parseInt(sp.get('page') ?? '1', 10)

  const authorScopeId = access.isEditor ? undefined : user.id

  const { posts, total } = await listPostsAdmin({ tab, q, page, perPage: 25, authorScopeId })

  const [tagsByPost, authors] = await Promise.all([
    getTagsForPosts(posts.map((p) => p.id)),
    prisma.user.findMany({
      where: { id: { in: posts.map((p) => p.authorId).filter((id): id is string => !!id) } },
      select: { id: true, displayName: true, username: true },
    }),
  ])
  const authorNameById = Object.fromEntries(authors.map((a) => [a.id, a.displayName ?? a.username]))

  const enriched = posts.map((p) => ({
    ...p,
    tags: tagsByPost[p.id] ?? [],
    authorName: p.authorId ? authorNameById[p.authorId] ?? null : (p.importedAuthorName ?? null),
  }))

  return NextResponse.json({ posts: enriched, total })
}

const CreateBody = z.object({
  title: z.string().min(1).max(200),
  templateId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!canViewGazetteAdmin(access)) return errorResponse('Forbidden', 403)

  const parsed = CreateBody.safeParse(await request.json())
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')

  const { title, templateId } = parsed.data
  const baseSlug = slugifyTitle(title)
  const slug = await ensureUniquePostSlug(baseSlug)

  let templateBuilderData = null
  if (templateId) {
    const template = await getTemplateById(templateId)
    templateBuilderData = template?.builderData ?? null
  }

  const post = await createPost({ title, slug, authorId: user.id, templateBuilderData })
  return NextResponse.json(post, { status: 201 })
}
