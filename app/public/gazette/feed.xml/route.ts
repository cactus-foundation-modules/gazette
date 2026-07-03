import { getVisiblePosts } from '@/modules/gazette/lib/db'
import { getGazetteSettings } from '@/modules/gazette/lib/settings'
import { buildRssXml } from '@/modules/gazette/lib/feed'
import { prisma } from '@/lib/db/prisma'

function siteUrl(): string {
  return process.env.SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
}

export async function GET() {
  const settings = await getGazetteSettings()
  if (!settings.rssEnabled) return new Response('Not found', { status: 404 })

  const { posts } = await getVisiblePosts({ page: 1, perPage: 20 })
  const authorIds = posts.map((p) => p.authorId).filter((id): id is string => !!id)
  const authors = authorIds.length
    ? await prisma.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, displayName: true, username: true } })
    : []
  const authorNameById = Object.fromEntries(authors.map((a) => [a.id, a.displayName ?? a.username]))

  const xml = buildRssXml({
    siteUrl: siteUrl(),
    siteName: 'Cactus',
    settings,
    posts: posts.map((p) => ({
      ...p,
      authorName: p.authorId ? authorNameById[p.authorId] ?? null : p.importedAuthorName,
      effectiveDate: p.publishedAt ?? p.scheduledFor ?? p.createdAt,
    })),
  })

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } })
}
