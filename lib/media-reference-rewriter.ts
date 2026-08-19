import { prisma } from '@/lib/db/prisma'
import type { MediaReferenceChange } from '@/lib/media/reference-rewriters'

// Provider for the core.media-reference-rewriters extension point.
//
// A post's body is a Puck document in gz_posts.builder_data, and every picture
// or video in it is addressed by url inside that JSON. Core rewrites the builder
// JSON it owns (pages and layouts) but has never seen this column, so a blob
// that moves used to take the illustrations out of every article that used it.
//
// The rows are prefiltered in SQL by a literal substring search, so only the
// handful of posts that actually mention the old url are read back and written.
// The replacement is done on the serialised JSON: a url is an opaque string
// inside it, and neither form contains a character JSON escapes, so swapping one
// for the other cannot change the document's shape.
export async function gazetteMediaReferenceRewriter(change: MediaReferenceChange): Promise<void> {
  const { oldUrl, newUrl } = change
  if (!oldUrl || oldUrl === newUrl) return

  const rows = await prisma.$queryRaw<{ id: string; builderData: string }[]>`
    SELECT "id", "builder_data"::text AS "builderData"
    FROM "gz_posts"
    WHERE position(${oldUrl} in "builder_data"::text) > 0
  `

  for (const row of rows) {
    const rewritten = row.builderData.split(oldUrl).join(newUrl)
    if (rewritten === row.builderData) continue
    await prisma.$executeRaw`
      UPDATE "gz_posts" SET "builder_data" = ${rewritten}::jsonb WHERE "id" = ${row.id}
    `
  }
}
