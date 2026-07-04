import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db/prisma'
import { publicVisibleSql, effectivePublishedSql } from './visibility'

export async function getPublicSitemapEntries(siteUrl: string): Promise<MetadataRoute.Sitemap> {
  const rows = await prisma.$queryRaw<Array<{ slug: string; updated_at: Date }>>`
    SELECT "slug", "updated_at" FROM "gz_posts" WHERE ${publicVisibleSql()}
    ORDER BY ${effectivePublishedSql()} DESC
  `

  return [
    { url: `${siteUrl}/gazette`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    ...rows.map((r) => ({
      url: `${siteUrl}/gazette/${r.slug}`,
      lastModified: r.updated_at,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}
