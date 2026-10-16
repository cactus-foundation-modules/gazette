import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'
import { getPostUrlStyle, postUrl } from './post-url'
import { siteUrl } from './site-url'
import type { PostStatus } from './types'

// What a tab published into `gazette.admin-tabs` is handed: every post, flattened
// and JSON-safe, with its public address already worked out from the site's URL
// style so the tab never has to know how Gazette builds one.
export type GazetteTabPost = {
  id: string
  title: string
  excerpt: string | null
  url: string
  status: PostStatus
  date: string | null
  // False when there is no public address to share: not live yet, or members-only.
  canShare: boolean
}

type Row = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  status: PostStatus
  published_at: Date | null
  scheduled_for: Date | null
  is_private: boolean
}

const LIMIT = 1000

export async function listPostsForTabs(authorScopeId?: string): Promise<GazetteTabPost[]> {
  const where = authorScopeId ? Prisma.sql`WHERE "author_id" = ${authorScopeId}` : Prisma.empty
  const [rows, style] = await Promise.all([
    prisma.$queryRaw<Row[]>`
      SELECT "id","title","slug","excerpt","status","published_at","scheduled_for","is_private"
      FROM "gz_posts" ${where}
      ORDER BY COALESCE("published_at","scheduled_for","created_at") DESC LIMIT ${LIMIT}
    `,
    getPostUrlStyle(),
  ])
  const base = siteUrl()
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    url: postUrl(base, r.slug, style),
    status: r.status,
    date: (r.published_at ?? r.scheduled_for)?.toISOString() ?? null,
    canShare: r.status === 'PUBLISHED' && !r.is_private,
  }))
}
