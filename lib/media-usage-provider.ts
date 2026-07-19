import { prisma } from '@/lib/db/prisma'

// Provider for the core.media-usage-providers extension point.
//
// Every published article's hero image and every author's portrait are Media id
// columns core cannot see, so the library counted the whole back catalogue's
// artwork as unused.
export async function gazetteMediaUsageProvider(): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ ref: string | null }[]>`
    SELECT "featured_image_id" AS ref FROM "gz_posts" WHERE "featured_image_id" IS NOT NULL
    UNION ALL
    SELECT "avatar_id" AS ref FROM "gz_author_profiles" WHERE "avatar_id" IS NOT NULL
  `
  return rows.map((r) => r.ref).filter((r): r is string => !!r)
}
