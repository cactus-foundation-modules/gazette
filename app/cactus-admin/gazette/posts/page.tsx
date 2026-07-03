import { getSessionFromCookie } from '@/lib/auth/session'
import { getGazetteAccess, canViewGazetteAdmin } from '@/modules/gazette/lib/permissions'
import { listPostsAdmin, normaliseScheduledPosts, getTagsForPosts } from '@/modules/gazette/lib/db'
import type { PostsTab } from '@/modules/gazette/lib/db'
import { prisma } from '@/lib/db/prisma'
import GazetteNav from '@/modules/gazette/components/admin/GazetteNav'
import PostList from '@/modules/gazette/components/admin/PostList'
import { headers } from 'next/headers'

export const metadata = { title: 'Gazette Posts — Admin' }

const VALID_TABS = ['all', 'drafts', 'published', 'scheduled', 'pinned', 'private']

type Props = { searchParams: Promise<Record<string, string>> }

export default async function GazettePostsPage({ searchParams }: Props) {
  const user = await getSessionFromCookie()
  if (!user) return null
  const access = await getGazetteAccess(user)
  if (!canViewGazetteAdmin(access)) {
    return <div className="alert alert-danger">You do not have permission to manage the gazette.</div>
  }

  await normaliseScheduledPosts()

  const sp = await searchParams
  const tabParam = sp.tab ?? 'all'
  const tab = (VALID_TABS.includes(tabParam) ? tabParam : 'all') as PostsTab
  const q = sp.q
  const page = parseInt(sp.page ?? '1', 10)
  const authorScopeId = access.isEditor ? undefined : user.id

  const { posts, total } = await listPostsAdmin({ tab, q, page, perPage: 25, authorScopeId })
  const tagsByPost = await getTagsForPosts(posts.map((p) => p.id))
  const authors = await prisma.user.findMany({
    where: { id: { in: posts.map((p) => p.authorId).filter((id): id is string => !!id) } },
    select: { id: true, displayName: true, username: true },
  })
  const authorNameById = Object.fromEntries(authors.map((a) => [a.id, a.displayName ?? a.username]))
  const enriched = posts.map((p) => ({
    ...p,
    tags: tagsByPost[p.id] ?? [],
    authorName: p.authorId ? authorNameById[p.authorId] ?? null : (p.importedAuthorName ?? null),
  }))

  const totalPages = Math.max(1, Math.ceil(total / 25))
  const adminPath = (await headers()).get('x-cactus-admin-path') ?? ''

  return (
    <div>
      <GazetteNav access={access} />
      <div className="page-header">
        <h1 className="page-title">Gazette</h1>
        <a href={`/${adminPath}/m/gazette/posts/new`} className="btn btn-primary">New Post</a>
      </div>

      <PostList
        posts={enriched}
        total={total}
        page={page}
        totalPages={totalPages}
        tab={tab}
        q={q ?? ''}
      />
    </div>
  )
}
