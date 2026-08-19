import { prisma } from '@/lib/db/prisma'
import { generateSlug } from '@/lib/utils'
import { getInstalledPublicBasePaths } from '@/lib/modules/public'
import { getPostUrlStyle } from './post-url'

export function slugifyTitle(title: string): string {
  return generateSlug(title)
}

// Sub-route segments a post slug must never collide with, since /gazette/<slug>
// shares the URL space with /gazette/tag, /gazette/series, /gazette/archive etc.
export const RESERVED_POST_SLUGS = ['tag', 'series', 'archive', 'feed.xml', 'preview', 'page']

// Top-level segments core keeps for itself. Only matter on the ROOT URL style,
// where a post sits alongside them rather than safely under /gazette.
const RESERVED_ROOT_SLUGS = [
  'api', 'setup', 'cactus-admin', 'cactus-status', 'cactus-account',
  'layout-preview', 'page-preview', 'members', 'logged-out',
  'sitemap.xml', 'robots.txt',
]

// Everything a post slug would lose a fight with. Core resolves a bare slug as
// info page, then module index, then a post - so a post sharing a name with
// either of the first two would simply never be reachable. Cheaper to rename it
// here than to leave an owner wondering why their post 404s.
async function takenRootSlugs(): Promise<Set<string>> {
  if ((await getPostUrlStyle()) !== 'ROOT') return new Set()

  const [bases, pages] = await Promise.all([
    getInstalledPublicBasePaths(),
    prisma.infoPage.findMany({ select: { slug: true } }),
  ])
  return new Set([...RESERVED_ROOT_SLUGS, ...bases.keys(), ...pages.map((p) => p.slug)])
}

export async function ensureUniquePostSlug(base: string, excludeId?: string): Promise<string> {
  const blocked = await takenRootSlugs()
  let slug = base || 'post'
  let suffix = 2
  for (;;) {
    if (!RESERVED_POST_SLUGS.includes(slug) && !blocked.has(slug)) {
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
