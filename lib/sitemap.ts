import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db/prisma'
import { publicVisibleSql, effectivePublishedSql } from './visibility'
import { getPostUrlStyle, postUrl } from './post-url'

export async function getPublicSitemapEntries(siteUrl: string): Promise<MetadataRoute.Sitemap> {
  const [rows, style] = await Promise.all([
    prisma.$queryRaw<Array<{ slug: string; updated_at: Date }>>`
      SELECT "slug", "updated_at" FROM "gz_posts" WHERE ${publicVisibleSql()}
      ORDER BY ${effectivePublishedSql()} DESC
    `,
    getPostUrlStyle(),
  ])

  return [
    { url: `${siteUrl}/gazette`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    ...rows.map((r) => ({
      url: postUrl(siteUrl, r.slug, style),
      lastModified: r.updated_at,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}
