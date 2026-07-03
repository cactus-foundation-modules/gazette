import { prisma } from '@/lib/db/prisma'
import { generateSlug } from '@/lib/utils'

export function slugifyTitle(title: string): string {
  return generateSlug(title)
}

// Sub-route segments a post slug must never collide with, since /gazette/<slug>
// shares the URL space with /gazette/tag, /gazette/series, /gazette/archive etc.
export const RESERVED_POST_SLUGS = ['tag', 'series', 'archive', 'feed.xml', 'preview', 'page']

export async function ensureUniquePostSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base || 'post'
  let suffix = 2
  for (;;) {
    if (!RESERVED_POST_SLUGS.includes(slug)) {
      const rows = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "gz_posts" WHERE "slug" = ${slug} LIMIT 1
      `
      const clash = rows[0]
      if (!clash || clash.id === excludeId) return slug
    }
    slug = `${base || 'post'}-${suffix}`
    suffix += 1
  }
}
