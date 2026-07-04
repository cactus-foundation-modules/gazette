import { Prisma } from '@prisma/client'

// A post is publicly visible once it's PUBLISHED (with a published_at in the
// past) or SCHEDULED with a scheduled_for in the past - the latter is what lets
// scheduled posts go live on time with no cron job (Decision 1). Rows are
// normalised from SCHEDULED to PUBLISHED lazily elsewhere (see normaliseScheduledPosts);
// this predicate is what makes that normalisation non-load-bearing for correctness.
//
// Wrapped in functions (not built eagerly at module scope) because this file is
// transitively imported by every Gazette Puck block - including the client-safe
// editor render path - and Prisma.sql throws immediately if evaluated in a
// browser bundle. Deferring the tagged template to call time keeps it inert
// until a server-side data-access function actually invokes it.
export function publicVisibleSql() {
  return Prisma.sql`
    (
      ("status" = 'PUBLISHED' AND "published_at" <= NOW())
      OR ("status" = 'SCHEDULED' AND "scheduled_for" <= NOW())
    )
    AND "is_private" = false
  `
}

// The date every public list/archive/feed orders and buckets by - whichever of
// published_at/scheduled_for is set, since a lazily-visible SCHEDULED row may not
// have published_at populated yet.
export function effectivePublishedSql() {
  return Prisma.sql`COALESCE("published_at", "scheduled_for")`
}
