import { prisma } from '@/lib/db/prisma'
import { getGazetteSettings } from './settings'

// Answers core's "does any module own this bare slug?" question, registered
// through publicRootSlug in cactus.module.json.
//
// Core asks only after it has failed to find an info page or a module index at
// the slug, so an info page of the same name still wins. Claims nothing at all
// while the site is on the default /gazette/<slug> style.
//
// Deliberately matches any post row, not just a publicly visible one: an
// unpublished post still owns its address, and the page it hands back 404s for
// a visitor exactly as /gazette/<slug> always did.
export async function gazetteClaimsRootSlug(slug: string): Promise<boolean> {
  const settings = await getGazetteSettings()
  if (settings.postUrlStyle !== 'ROOT') return false

  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "gz_posts" WHERE "slug" = ${slug} LIMIT 1
  `
  return rows.length > 0
}
