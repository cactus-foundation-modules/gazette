import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { getVisiblePosts } from '@/modules/gazette/lib/db'
import { getGazetteSettings } from '@/modules/gazette/lib/settings'
import GazetteStyles from '@/modules/gazette/components/public/GazetteStyles'
import PostGrid from '@/modules/gazette/components/public/PostGrid'
import Pagination from '@/modules/gazette/components/public/Pagination'

type Props = { params: Promise<{ username: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

function getPage(sp: Record<string, string | string[] | undefined>): number {
  const raw = sp.page
  const val = Array.isArray(raw) ? raw[0] : raw
  return Math.max(1, parseInt(val ?? '1', 10) || 1)
}

async function getAuthor(username: string) {
  const user = await prisma.user.findUnique({ where: { username }, select: { id: true, username: true, displayName: true } })
  if (!user) return null
  const profile = await prisma.$queryRaw<Array<{ bio: string | null }>>`SELECT "bio" FROM "gz_author_profiles" WHERE "user_id" = ${user.id} LIMIT 1`
  return { ...user, bio: profile[0]?.bio ?? null }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const author = await getAuthor(username)
  if (!author) return {}
  return { title: `${author.displayName ?? author.username} - Gazette` }
}

export default async function GazetteAuthorPage({ params, searchParams }: Props) {
  const { username } = await params
  const author = await getAuthor(username)
  if (!author) notFound()

  const settings = await getGazetteSettings()
  const sp = await searchParams
  const page = getPage(sp)
  const { posts, total } = await getVisiblePosts({ page, perPage: settings.postsPerPage, authorId: author.id })
  const totalPages = Math.max(1, Math.ceil(total / settings.postsPerPage))

  return (
    <div className="gz-wide">
      <GazetteStyles />
      <h1>{author.displayName ?? author.username}</h1>
      {author.bio && <p style={{ color: 'var(--color-text-muted)' }}>{author.bio}</p>}
      <PostGrid posts={posts} showViewCounts={settings.showViewCounts} />
      <Pagination page={page} totalPages={totalPages} baseUrl={`/gazette/author/${username}`} />
    </div>
  )
}
