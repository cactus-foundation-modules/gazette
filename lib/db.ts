import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'
import { publicVisibleSql, effectivePublishedSql } from './visibility'
import type {
  GazettePost, GazettePostListItem, GazetteTag, GazetteTagWithCount, GazetteSeries,
  GazetteAuthorProfile, GazetteComment, GazettePostTemplate, PuckData,
} from './types'

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

function mapPostRow(r: Record<string, unknown>): GazettePost {
  return {
    id: r.id as string,
    title: r.title as string,
    slug: r.slug as string,
    excerpt: (r.excerpt as string | null) ?? null,
    status: r.status as GazettePost['status'],
    publishedAt: (r.published_at as Date | null) ?? null,
    scheduledFor: (r.scheduled_for as Date | null) ?? null,
    featuredImageId: (r.featured_image_id as string | null) ?? null,
    authorId: (r.author_id as string | null) ?? null,
    importedAuthorName: (r.imported_author_name as string | null) ?? null,
    seoTitle: (r.seo_title as string | null) ?? null,
    seoDescription: (r.seo_description as string | null) ?? null,
    canonicalUrl: (r.canonical_url as string | null) ?? null,
    builderData: (r.builder_data as PuckData | null) ?? null,
    isPinned: r.is_pinned as boolean,
    isPrivate: r.is_private as boolean,
    viewCount: r.view_count as number,
    seriesId: (r.series_id as string | null) ?? null,
    seriesOrder: (r.series_order as number | null) ?? null,
    previewTokenHash: (r.preview_token_hash as string | null) ?? null,
    previewTokenExpiresAt: (r.preview_token_expires_at as Date | null) ?? null,
    createdAt: r.created_at as Date,
    updatedAt: r.updated_at as Date,
  }
}

function mapPostListRow(r: Record<string, unknown>): GazettePostListItem {
  const { builderData: _builderData, ...rest } = mapPostRow({ ...r, builder_data: null })
  return rest
}

export async function createPost(data: {
  title: string
  slug: string
  authorId: string | null
  templateBuilderData?: PuckData | null
}): Promise<{ id: string }> {
  const rows = await prisma.$queryRaw<[{ id: string }]>`
    INSERT INTO "gz_posts" ("id", "title", "slug", "author_id", "builder_data")
    VALUES (gen_random_uuid()::text, ${data.title}, ${data.slug}, ${data.authorId},
      ${data.templateBuilderData ? JSON.stringify(data.templateBuilderData) : null}::jsonb)
    RETURNING "id"
  `
  return rows[0]
}

export async function getPostById(id: string): Promise<GazettePost | null> {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT * FROM "gz_posts" WHERE "id" = ${id} LIMIT 1
  `
  return rows[0] ? mapPostRow(rows[0]) : null
}

// True only when the post exists and is publicly viewable (published/scheduled-in-
// the-past and not private) - the same predicate the public list/detail paths use.
// Public engagement endpoints (views, reactions) call this so a draft/private/
// unknown id can't inflate view counts, attract reactions, or 500 on a FK error.
export async function isPostPubliclyVisible(id: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "gz_posts" WHERE "id" = ${id} AND ${publicVisibleSql()} LIMIT 1
  `
  return !!rows[0]
}

export type UpdatePostInput = Partial<{
  title: string
  slug: string
  excerpt: string | null
  builderData: PuckData | null
  featuredImageId: string | null
  authorId: string | null
  seriesId: string | null
  seriesOrder: number | null
  seoTitle: string | null
  seoDescription: string | null
  canonicalUrl: string | null
  isPinned: boolean
  isPrivate: boolean
}>

export async function updatePost(id: string, fields: UpdatePostInput): Promise<void> {
  const sets: Prisma.Sql[] = []
  if (fields.title !== undefined) sets.push(Prisma.sql`"title" = ${fields.title}`)
  if (fields.slug !== undefined) sets.push(Prisma.sql`"slug" = ${fields.slug}`)
  if (fields.excerpt !== undefined) sets.push(Prisma.sql`"excerpt" = ${fields.excerpt}`)
  if (fields.builderData !== undefined) sets.push(Prisma.sql`"builder_data" = ${fields.builderData ? JSON.stringify(fields.builderData) : null}::jsonb`)
  if (fields.featuredImageId !== undefined) sets.push(Prisma.sql`"featured_image_id" = ${fields.featuredImageId}`)
  if (fields.authorId !== undefined) sets.push(Prisma.sql`"author_id" = ${fields.authorId}`)
  if (fields.seriesId !== undefined) sets.push(Prisma.sql`"series_id" = ${fields.seriesId}`)
  if (fields.seriesOrder !== undefined) sets.push(Prisma.sql`"series_order" = ${fields.seriesOrder}`)
  if (fields.seoTitle !== undefined) sets.push(Prisma.sql`"seo_title" = ${fields.seoTitle}`)
  if (fields.seoDescription !== undefined) sets.push(Prisma.sql`"seo_description" = ${fields.seoDescription}`)
  if (fields.canonicalUrl !== undefined) sets.push(Prisma.sql`"canonical_url" = ${fields.canonicalUrl}`)
  if (fields.isPinned !== undefined) sets.push(Prisma.sql`"is_pinned" = ${fields.isPinned}`)
  if (fields.isPrivate !== undefined) sets.push(Prisma.sql`"is_private" = ${fields.isPrivate}`)
  if (sets.length === 0) return

  sets.push(Prisma.sql`"updated_at" = CURRENT_TIMESTAMP`)
  const setClause = Prisma.join(sets, ', ')
  await prisma.$executeRaw`UPDATE "gz_posts" SET ${setClause} WHERE "id" = ${id}`
}

export async function publishPost(id: string, action: 'publish' | 'schedule' | 'unpublish', scheduledFor?: Date): Promise<void> {
  if (action === 'publish') {
    await prisma.$executeRaw`
      UPDATE "gz_posts" SET "status" = 'PUBLISHED', "published_at" = COALESCE("published_at", CURRENT_TIMESTAMP),
        "scheduled_for" = NULL, "updated_at" = CURRENT_TIMESTAMP WHERE "id" = ${id}
    `
  } else if (action === 'schedule' && scheduledFor) {
    await prisma.$executeRaw`
      UPDATE "gz_posts" SET "status" = 'SCHEDULED', "scheduled_for" = ${scheduledFor},
        "updated_at" = CURRENT_TIMESTAMP WHERE "id" = ${id}
    `
  } else if (action === 'unpublish') {
    await prisma.$executeRaw`
      UPDATE "gz_posts" SET "status" = 'DRAFT', "scheduled_for" = NULL,
        "updated_at" = CURRENT_TIMESTAMP WHERE "id" = ${id}
    `
  }
}

// Imported posts land as DRAFT but keep the source's original publish date for
// display/ordering once the editor actually publishes them.
export async function setImportedPublishedAt(id: string, publishedAt: Date, importedAuthorName: string | null): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "gz_posts" SET "published_at" = ${publishedAt}, "imported_author_name" = ${importedAuthorName}, "updated_at" = CURRENT_TIMESTAMP
    WHERE "id" = ${id}
  `
}

export async function deletePost(id: string): Promise<void> {
  await prisma.$executeRaw`DELETE FROM "gz_posts" WHERE "id" = ${id}`
}

export async function bulkDeletePosts(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  await prisma.$executeRaw`DELETE FROM "gz_posts" WHERE "id" IN (${Prisma.join(ids)})`
}

// Promotes any SCHEDULED post whose time has arrived to PUBLISHED. Called
// opportunistically from admin reads/writes (Decision 1 - no cron needed for
// correctness, this just keeps the DB status column tidy for admin display).
export async function normaliseScheduledPosts(): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "gz_posts" SET "status" = 'PUBLISHED', "published_at" = COALESCE("published_at", "scheduled_for")
    WHERE "status" = 'SCHEDULED' AND "scheduled_for" <= NOW()
  `
}

export type PostsTab = 'all' | 'drafts' | 'published' | 'scheduled' | 'pinned' | 'private'

export async function listPostsAdmin(opts: {
  tab?: PostsTab
  q?: string
  page?: number
  perPage?: number
  authorScopeId?: string
}): Promise<{ posts: GazettePostListItem[]; total: number }> {
  const page = opts.page ?? 1
  const perPage = opts.perPage ?? 25
  const offset = (page - 1) * perPage

  const conditions: Prisma.Sql[] = []
  switch (opts.tab) {
    case 'drafts': conditions.push(Prisma.sql`"status" = 'DRAFT'`); break
    case 'published': conditions.push(Prisma.sql`"status" = 'PUBLISHED'`); break
    case 'scheduled': conditions.push(Prisma.sql`"status" = 'SCHEDULED'`); break
    case 'pinned': conditions.push(Prisma.sql`"is_pinned" = true`); break
    case 'private': conditions.push(Prisma.sql`"is_private" = true`); break
    default: break
  }
  if (opts.q) conditions.push(Prisma.sql`"title" ILIKE ${'%' + opts.q + '%'}`)
  if (opts.authorScopeId) conditions.push(Prisma.sql`"author_id" = ${opts.authorScopeId}`)

  const where = conditions.length ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty

  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT "id","title","slug","excerpt","status","published_at","scheduled_for","featured_image_id",
        "author_id","imported_author_name","seo_title","seo_description","canonical_url",
        "is_pinned","is_private","view_count","series_id","series_order",
        "preview_token_hash","preview_token_expires_at","created_at","updated_at"
      FROM "gz_posts" ${where}
      ORDER BY "updated_at" DESC LIMIT ${perPage} OFFSET ${offset}
    `,
    prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) FROM "gz_posts" ${where}`,
  ])

  return { posts: rows.map(mapPostListRow), total: Number(countRows[0].count) }
}

export async function getVisiblePosts(opts: {
  page?: number
  perPage?: number
  tagSlug?: string
  seriesSlug?: string
  authorId?: string
  year?: number
  month?: number
  limit?: number
}): Promise<{ posts: GazettePostListItem[]; total: number }> {
  const page = opts.page ?? 1
  const perPage = opts.limit ?? opts.perPage ?? 10
  const offset = (page - 1) * perPage

  const conditions: Prisma.Sql[] = [publicVisibleSql()]
  let joinTag = Prisma.empty
  let joinSeries = Prisma.empty

  if (opts.tagSlug) {
    joinTag = Prisma.sql`JOIN "gz_post_tags" pt ON pt."post_id" = p."id" JOIN "gz_tags" t ON t."id" = pt."tag_id"`
    conditions.push(Prisma.sql`t."slug" = ${opts.tagSlug}`)
  }
  if (opts.seriesSlug) {
    joinSeries = Prisma.sql`JOIN "gz_series" s ON s."id" = p."series_id"`
    conditions.push(Prisma.sql`s."slug" = ${opts.seriesSlug}`)
  }
  if (opts.authorId) {
    conditions.push(Prisma.sql`p."author_id" = ${opts.authorId}`)
  }
  if (opts.year) {
    const monthStart = opts.month ? `${opts.year}-${String(opts.month).padStart(2, '0')}-01` : `${opts.year}-01-01`
    const monthEnd = opts.month
      ? new Date(Date.UTC(opts.month === 12 ? opts.year + 1 : opts.year, opts.month === 12 ? 0 : opts.month, 1)).toISOString()
      : `${opts.year + 1}-01-01`
    conditions.push(Prisma.sql`${effectivePublishedSql()} >= ${monthStart}::timestamp AND ${effectivePublishedSql()} < ${monthEnd}::timestamp`)
  }

  const where = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`

  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT p."id",p."title",p."slug",p."excerpt",p."status",p."published_at",p."scheduled_for",p."featured_image_id",
        p."author_id",p."imported_author_name",p."seo_title",p."seo_description",p."canonical_url",
        p."is_pinned",p."is_private",p."view_count",p."series_id",p."series_order",
        p."preview_token_hash",p."preview_token_expires_at",p."created_at",p."updated_at"
      FROM "gz_posts" p ${joinTag} ${joinSeries} ${where}
      ORDER BY p."is_pinned" DESC, ${effectivePublishedSql()} DESC
      LIMIT ${perPage} OFFSET ${offset}
    `,
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) FROM "gz_posts" p ${joinTag} ${joinSeries} ${where}
    `,
  ])

  return { posts: rows.map(mapPostListRow), total: Number(countRows[0].count) }
}

export async function getPostTitlesByIds(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {}
  const rows = await prisma.$queryRaw<Array<{ id: string; title: string }>>`
    SELECT "id", "title" FROM "gz_posts" WHERE "id" IN (${Prisma.join(ids)})
  `
  return Object.fromEntries(rows.map((r) => [r.id, r.title]))
}

export async function getVisiblePostBySlug(slug: string): Promise<GazettePost | null> {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT * FROM "gz_posts" WHERE "slug" = ${slug} AND ${publicVisibleSql()} LIMIT 1
  `
  return rows[0] ? mapPostRow(rows[0]) : null
}

export async function setPreviewToken(id: string, hash: string, expiresAt: Date): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "gz_posts" SET "preview_token_hash" = ${hash}, "preview_token_expires_at" = ${expiresAt}
    WHERE "id" = ${id}
  `
}

export async function getPostByPreviewHash(hash: string): Promise<GazettePost | null> {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT * FROM "gz_posts"
    WHERE "preview_token_hash" = ${hash} AND "preview_token_expires_at" > NOW()
    LIMIT 1
  `
  return rows[0] ? mapPostRow(rows[0]) : null
}

export async function getRelatedPosts(postId: string, tagIds: string[], limit = 3): Promise<GazettePostListItem[]> {
  if (tagIds.length > 0) {
    const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT p."id",p."title",p."slug",p."excerpt",p."status",p."published_at",p."scheduled_for",p."featured_image_id",
        p."author_id",p."imported_author_name",p."seo_title",p."seo_description",p."canonical_url",
        p."is_pinned",p."is_private",p."view_count",p."series_id",p."series_order",
        p."preview_token_hash",p."preview_token_expires_at",p."created_at",p."updated_at",
        COUNT(pt."tag_id") as shared_tags
      FROM "gz_posts" p
      JOIN "gz_post_tags" pt ON pt."post_id" = p."id" AND pt."tag_id" IN (${Prisma.join(tagIds)})
      WHERE p."id" != ${postId} AND ${publicVisibleSql()}
      GROUP BY p."id"
      ORDER BY shared_tags DESC, ${effectivePublishedSql()} DESC
      LIMIT ${limit}
    `
    if (rows.length > 0) return rows.map(mapPostListRow)
  }

  const fallback = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT "id","title","slug","excerpt","status","published_at","scheduled_for","featured_image_id",
      "author_id","imported_author_name","seo_title","seo_description","canonical_url",
      "is_pinned","is_private","view_count","series_id","series_order",
      "preview_token_hash","preview_token_expires_at","created_at","updated_at"
    FROM "gz_posts"
    WHERE "id" != ${postId} AND ${publicVisibleSql()}
    ORDER BY ${effectivePublishedSql()} DESC
    LIMIT ${limit}
  `
  return fallback.map(mapPostListRow)
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

function mapTagRow(r: Record<string, unknown>): GazetteTag {
  return { id: r.id as string, name: r.name as string, slug: r.slug as string, createdAt: r.created_at as Date }
}

export async function listTags(): Promise<GazetteTag[]> {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`SELECT * FROM "gz_tags" ORDER BY "name" ASC`
  return rows.map(mapTagRow)
}

export async function getTagsWithCounts(): Promise<GazetteTagWithCount[]> {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT t.*, COUNT(pt."post_id")::int as post_count
    FROM "gz_tags" t
    LEFT JOIN "gz_post_tags" pt ON pt."tag_id" = t."id"
    GROUP BY t."id"
    ORDER BY t."name" ASC
  `
  return rows.map((r) => ({ ...mapTagRow(r), postCount: r.post_count as number }))
}

export async function createTag(name: string, slug: string): Promise<{ id: string }> {
  const rows = await prisma.$queryRaw<[{ id: string }]>`
    INSERT INTO "gz_tags" ("id", "name", "slug") VALUES (gen_random_uuid()::text, ${name}, ${slug})
    RETURNING "id"
  `
  return rows[0]
}

export async function updateTag(id: string, fields: { name?: string; slug?: string }): Promise<void> {
  const sets: Prisma.Sql[] = []
  if (fields.name !== undefined) sets.push(Prisma.sql`"name" = ${fields.name}`)
  if (fields.slug !== undefined) sets.push(Prisma.sql`"slug" = ${fields.slug}`)
  if (sets.length === 0) return
  await prisma.$executeRaw`UPDATE "gz_tags" SET ${Prisma.join(sets, ', ')} WHERE "id" = ${id}`
}

export async function countPostsForTag(id: string): Promise<number> {
  const rows = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) FROM "gz_post_tags" WHERE "tag_id" = ${id}
  `
  return Number(rows[0].count)
}

export async function deleteTag(id: string): Promise<void> {
  await prisma.$executeRaw`DELETE FROM "gz_tags" WHERE "id" = ${id}`
}

export async function getOrCreateTagsByName(names: string[]): Promise<string[]> {
  const ids: string[] = []
  for (const name of names) {
    const trimmed = name.trim()
    if (!trimmed) continue
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
    const existing = await prisma.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "gz_tags" WHERE "slug" = ${slug} LIMIT 1`
    if (existing[0]) { ids.push(existing[0].id); continue }
    const created = await createTag(trimmed, slug)
    ids.push(created.id)
  }
  return ids
}

export async function findPostBySlugExact(slug: string): Promise<{ id: string } | null> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "gz_posts" WHERE "slug" = ${slug} LIMIT 1`
  return rows[0] ?? null
}

export async function setPostTags(postId: string, tagIds: string[]): Promise<void> {
  await prisma.$transaction([
    prisma.$executeRaw`DELETE FROM "gz_post_tags" WHERE "post_id" = ${postId}`,
    ...(tagIds.length > 0
      ? [prisma.$executeRaw`
          INSERT INTO "gz_post_tags" ("post_id", "tag_id")
          SELECT ${postId}, unnest(${tagIds}::text[])
        `]
      : []),
  ])
}

export async function getTagIdsForPost(postId: string): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ tag_id: string }>>`
    SELECT "tag_id" FROM "gz_post_tags" WHERE "post_id" = ${postId}
  `
  return rows.map((r) => r.tag_id)
}

export async function getTagsForPosts(postIds: string[]): Promise<Record<string, GazetteTag[]>> {
  if (postIds.length === 0) return {}
  const rows = await prisma.$queryRaw<Array<{ post_id: string } & Record<string, unknown>>>`
    SELECT pt."post_id", t.* FROM "gz_tags" t
    JOIN "gz_post_tags" pt ON pt."tag_id" = t."id"
    WHERE pt."post_id" IN (${Prisma.join(postIds)})
    ORDER BY t."name" ASC
  `
  const out: Record<string, GazetteTag[]> = {}
  for (const r of rows) {
    ;(out[r.post_id] ??= []).push(mapTagRow(r))
  }
  return out
}

export async function getTagsForPost(postId: string): Promise<GazetteTag[]> {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT t.* FROM "gz_tags" t
    JOIN "gz_post_tags" pt ON pt."tag_id" = t."id"
    WHERE pt."post_id" = ${postId}
    ORDER BY t."name" ASC
  `
  return rows.map(mapTagRow)
}

// ---------------------------------------------------------------------------
// Series
// ---------------------------------------------------------------------------

function mapSeriesRow(r: Record<string, unknown>): GazetteSeries {
  return {
    id: r.id as string, title: r.title as string, slug: r.slug as string,
    description: (r.description as string | null) ?? null,
    createdAt: r.created_at as Date, updatedAt: r.updated_at as Date,
  }
}

export async function listSeries(): Promise<Array<GazetteSeries & { postCount: number }>> {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT s.*, COUNT(p."id")::int as post_count
    FROM "gz_series" s
    LEFT JOIN "gz_posts" p ON p."series_id" = s."id"
    GROUP BY s."id"
    ORDER BY s."title" ASC
  `
  return rows.map((r) => ({ ...mapSeriesRow(r), postCount: r.post_count as number }))
}

export async function getSeriesById(id: string): Promise<GazetteSeries | null> {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`SELECT * FROM "gz_series" WHERE "id" = ${id} LIMIT 1`
  return rows[0] ? mapSeriesRow(rows[0]) : null
}

export async function createSeries(title: string, slug: string, description: string | null): Promise<{ id: string }> {
  const rows = await prisma.$queryRaw<[{ id: string }]>`
    INSERT INTO "gz_series" ("id", "title", "slug", "description")
    VALUES (gen_random_uuid()::text, ${title}, ${slug}, ${description})
    RETURNING "id"
  `
  return rows[0]
}

export async function updateSeries(id: string, fields: { title?: string; slug?: string; description?: string | null }): Promise<void> {
  const sets: Prisma.Sql[] = []
  if (fields.title !== undefined) sets.push(Prisma.sql`"title" = ${fields.title}`)
  if (fields.slug !== undefined) sets.push(Prisma.sql`"slug" = ${fields.slug}`)
  if (fields.description !== undefined) sets.push(Prisma.sql`"description" = ${fields.description}`)
  if (sets.length === 0) return
  sets.push(Prisma.sql`"updated_at" = CURRENT_TIMESTAMP`)
  await prisma.$executeRaw`UPDATE "gz_series" SET ${Prisma.join(sets, ', ')} WHERE "id" = ${id}`
}

export async function deleteSeries(id: string): Promise<void> {
  await prisma.$executeRaw`DELETE FROM "gz_series" WHERE "id" = ${id}`
}

export async function getSeriesPosts(seriesId: string): Promise<GazettePostListItem[]> {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT "id","title","slug","excerpt","status","published_at","scheduled_for","featured_image_id",
      "author_id","imported_author_name","seo_title","seo_description","canonical_url",
      "is_pinned","is_private","view_count","series_id","series_order",
      "preview_token_hash","preview_token_expires_at","created_at","updated_at"
    FROM "gz_posts" WHERE "series_id" = ${seriesId} ORDER BY "series_order" ASC NULLS LAST, "created_at" ASC
  `
  return rows.map(mapPostListRow)
}

export async function reorderSeriesPosts(seriesId: string, postIds: string[]): Promise<void> {
  await prisma.$transaction(
    postIds.map((id, index) =>
      prisma.$executeRaw`UPDATE "gz_posts" SET "series_order" = ${index}, "updated_at" = CURRENT_TIMESTAMP WHERE "id" = ${id} AND "series_id" = ${seriesId}`
    )
  )
}

// ---------------------------------------------------------------------------
// Author profiles
// ---------------------------------------------------------------------------

function mapAuthorProfileRow(r: Record<string, unknown>): GazetteAuthorProfile {
  return {
    id: r.id as string, userId: r.user_id as string,
    bio: (r.bio as string | null) ?? null, avatarId: (r.avatar_id as string | null) ?? null,
    createdAt: r.created_at as Date, updatedAt: r.updated_at as Date,
  }
}

export async function getAuthorProfile(userId: string): Promise<GazetteAuthorProfile | null> {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT * FROM "gz_author_profiles" WHERE "user_id" = ${userId} LIMIT 1
  `
  return rows[0] ? mapAuthorProfileRow(rows[0]) : null
}

export async function upsertAuthorProfile(userId: string, fields: { bio?: string | null; avatarId?: string | null }): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO "gz_author_profiles" ("id", "user_id", "bio", "avatar_id")
    VALUES (gen_random_uuid()::text, ${userId}, ${fields.bio ?? null}, ${fields.avatarId ?? null})
    ON CONFLICT ("user_id") DO UPDATE SET
      "bio" = COALESCE(${fields.bio ?? null}, "gz_author_profiles"."bio"),
      "avatar_id" = COALESCE(${fields.avatarId ?? null}, "gz_author_profiles"."avatar_id"),
      "updated_at" = CURRENT_TIMESTAMP
  `
}

export type AuthorListItem = { userId: string; email: string; username: string; displayName: string | null; role: string | null; postCount: number }

export async function listAuthors(): Promise<AuthorListItem[]> {
  const rows = await prisma.$queryRaw<Array<{
    userId: string; email: string; username: string; displayName: string | null
    isEditor: boolean; isAuthor: boolean; isContributor: boolean; postCount: number
  }>>`
    SELECT u."id" as "userId", u."email", u."username", u."displayName",
      bool_or(rp."permissionKey" = 'gazette.editor') as "isEditor",
      bool_or(rp."permissionKey" = 'gazette.author') as "isAuthor",
      bool_or(rp."permissionKey" = 'gazette.contributor') as "isContributor",
      COUNT(DISTINCT p."id")::int as "postCount"
    FROM "User" u
    LEFT JOIN "RolePermission" rp ON rp."roleId" = u."roleId" AND rp."permissionKey" IN ('gazette.editor', 'gazette.author', 'gazette.contributor')
    LEFT JOIN "gz_posts" p ON p."author_id" = u."id"
    WHERE rp."permissionKey" IS NOT NULL OR p."author_id" IS NOT NULL
    GROUP BY u."id"
    ORDER BY u."displayName" ASC NULLS LAST, u."username" ASC
  `
  return rows.map((r) => ({
    userId: r.userId, email: r.email, username: r.username, displayName: r.displayName,
    role: r.isEditor ? 'Editor' : r.isAuthor ? 'Author' : r.isContributor ? 'Contributor' : null,
    postCount: r.postCount,
  }))
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

function mapCommentRow(r: Record<string, unknown>): GazetteComment {
  return {
    id: r.id as string, postId: r.post_id as string, parentId: (r.parent_id as string | null) ?? null,
    authorName: r.author_name as string, authorEmail: r.author_email as string,
    authorUserId: (r.author_user_id as string | null) ?? null, body: r.body as string,
    status: r.status as GazetteComment['status'], ipAddress: (r.ip_address as string | null) ?? null,
    createdAt: r.created_at as Date, updatedAt: r.updated_at as Date,
  }
}

export async function listComments(opts: { status?: string; page?: number; perPage?: number }): Promise<{ comments: GazetteComment[]; total: number }> {
  const page = opts.page ?? 1
  const perPage = opts.perPage ?? 25
  const offset = (page - 1) * perPage
  const where = opts.status && opts.status !== 'all' ? Prisma.sql`WHERE "status" = ${opts.status}` : Prisma.empty

  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT * FROM "gz_comments" ${where} ORDER BY "created_at" DESC LIMIT ${perPage} OFFSET ${offset}
    `,
    prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) FROM "gz_comments" ${where}`,
  ])
  return { comments: rows.map(mapCommentRow), total: Number(countRows[0].count) }
}

export async function getCommentById(id: string): Promise<GazetteComment | null> {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`SELECT * FROM "gz_comments" WHERE "id" = ${id} LIMIT 1`
  return rows[0] ? mapCommentRow(rows[0]) : null
}

export async function countCommentsByStatus(): Promise<Record<string, number>> {
  const rows = await prisma.$queryRaw<Array<{ status: string; count: bigint }>>`
    SELECT "status", COUNT(*) as count FROM "gz_comments" GROUP BY "status"
  `
  return Object.fromEntries(rows.map((r) => [r.status, Number(r.count)]))
}

export async function getApprovedCommentCountsForPosts(postIds: string[]): Promise<Record<string, number>> {
  if (postIds.length === 0) return {}
  const rows = await prisma.$queryRaw<Array<{ post_id: string; count: bigint }>>`
    SELECT "post_id", COUNT(*) as count FROM "gz_comments"
    WHERE "post_id" IN (${Prisma.join(postIds)}) AND "status" = 'APPROVED'
    GROUP BY "post_id"
  `
  return Object.fromEntries(rows.map((r) => [r.post_id, Number(r.count)]))
}

export async function getApprovedCommentsForPost(postId: string): Promise<GazetteComment[]> {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT * FROM "gz_comments" WHERE "post_id" = ${postId} AND "status" = 'APPROVED' ORDER BY "created_at" ASC
  `
  return rows.map(mapCommentRow)
}

export async function checkCommentRateLimit(ip: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) FROM "gz_comments" WHERE "ip_address" = ${ip} AND "created_at" > NOW() - INTERVAL '10 minutes'
  `
  return Number(rows[0].count) < 5
}

export async function createComment(data: {
  postId: string
  parentId: string | null
  authorName: string
  authorEmail: string
  authorUserId: string | null
  body: string
  status: 'PENDING' | 'APPROVED'
  ipAddress: string | null
}): Promise<{ id: string }> {
  const rows = await prisma.$queryRaw<[{ id: string }]>`
    INSERT INTO "gz_comments"
      ("id", "post_id", "parent_id", "author_name", "author_email", "author_user_id", "body", "status", "ip_address")
    VALUES
      (gen_random_uuid()::text, ${data.postId}, ${data.parentId}, ${data.authorName}, ${data.authorEmail},
       ${data.authorUserId}, ${data.body}, ${data.status}, ${data.ipAddress})
    RETURNING "id"
  `
  return rows[0]
}

export async function updateCommentStatus(id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED'): Promise<void> {
  await prisma.$executeRaw`UPDATE "gz_comments" SET "status" = ${status}, "updated_at" = CURRENT_TIMESTAMP WHERE "id" = ${id}`
}

export async function deleteComment(id: string): Promise<void> {
  await prisma.$executeRaw`DELETE FROM "gz_comments" WHERE "id" = ${id}`
}

export async function bulkUpdateComments(ids: string[], action: 'approve' | 'reject' | 'delete'): Promise<void> {
  if (ids.length === 0) return
  if (action === 'delete') {
    await prisma.$executeRaw`DELETE FROM "gz_comments" WHERE "id" IN (${Prisma.join(ids)})`
  } else {
    const status = action === 'approve' ? 'APPROVED' : 'REJECTED'
    await prisma.$executeRaw`UPDATE "gz_comments" SET "status" = ${status}, "updated_at" = CURRENT_TIMESTAMP WHERE "id" IN (${Prisma.join(ids)})`
  }
}

// ---------------------------------------------------------------------------
// Reactions
// ---------------------------------------------------------------------------

export async function toggleReaction(postId: string, emoji: string, visitorToken: string): Promise<boolean> {
  const existing = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "gz_reactions" WHERE "post_id" = ${postId} AND "emoji" = ${emoji} AND "visitor_token" = ${visitorToken} LIMIT 1
  `
  if (existing[0]) {
    await prisma.$executeRaw`DELETE FROM "gz_reactions" WHERE "id" = ${existing[0].id}`
    return false
  }
  await prisma.$executeRaw`
    INSERT INTO "gz_reactions" ("id", "post_id", "emoji", "visitor_token")
    VALUES (gen_random_uuid()::text, ${postId}, ${emoji}, ${visitorToken})
    ON CONFLICT DO NOTHING
  `
  return true
}

export async function getReactionCounts(postId: string): Promise<Record<string, number>> {
  const rows = await prisma.$queryRaw<Array<{ emoji: string; count: bigint }>>`
    SELECT "emoji", COUNT(*) as count FROM "gz_reactions" WHERE "post_id" = ${postId} GROUP BY "emoji"
  `
  return Object.fromEntries(rows.map((r) => [r.emoji, Number(r.count)]))
}

// ---------------------------------------------------------------------------
// Views
// ---------------------------------------------------------------------------

export async function recordView(postId: string, visitorToken: string): Promise<void> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO "gz_post_views" ("id", "post_id", "visitor_token")
    VALUES (gen_random_uuid()::text, ${postId}, ${visitorToken})
    ON CONFLICT DO NOTHING
    RETURNING "id"
  `
  if (rows.length > 0) {
    await prisma.$executeRaw`UPDATE "gz_posts" SET "view_count" = "view_count" + 1 WHERE "id" = ${postId}`
  }
}

// ---------------------------------------------------------------------------
// User picker
// ---------------------------------------------------------------------------

export type UserPickerItem = { id: string; email: string; username: string; displayName: string | null; suspendedAt: Date | null }

export async function listUsersForPicker(q?: string): Promise<UserPickerItem[]> {
  const where = q
    ? Prisma.sql`WHERE "email" ILIKE ${'%' + q + '%'} OR "username" ILIKE ${'%' + q + '%'} OR "displayName" ILIKE ${'%' + q + '%'}`
    : Prisma.empty
  return prisma.$queryRaw<UserPickerItem[]>`
    SELECT "id", "email", "username", "displayName", "suspendedAt"
    FROM "User" ${where} ORDER BY "displayName" ASC NULLS LAST, "username" ASC LIMIT 50
  `
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

function mapTemplateRow(r: Record<string, unknown>): GazettePostTemplate {
  return {
    id: r.id as string, title: r.title as string, builderData: (r.builder_data as PuckData | null) ?? null,
    createdAt: r.created_at as Date, updatedAt: r.updated_at as Date,
  }
}

export async function listTemplates(): Promise<GazettePostTemplate[]> {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`SELECT * FROM "gz_post_templates" ORDER BY "title" ASC`
  return rows.map(mapTemplateRow)
}

export async function getTemplateById(id: string): Promise<GazettePostTemplate | null> {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`SELECT * FROM "gz_post_templates" WHERE "id" = ${id} LIMIT 1`
  return rows[0] ? mapTemplateRow(rows[0]) : null
}

export async function createTemplate(title: string, builderData: PuckData | null): Promise<{ id: string }> {
  const rows = await prisma.$queryRaw<[{ id: string }]>`
    INSERT INTO "gz_post_templates" ("id", "title", "builder_data")
    VALUES (gen_random_uuid()::text, ${title}, ${builderData ? JSON.stringify(builderData) : null}::jsonb)
    RETURNING "id"
  `
  return rows[0]
}

export async function renameTemplate(id: string, title: string): Promise<void> {
  await prisma.$executeRaw`UPDATE "gz_post_templates" SET "title" = ${title}, "updated_at" = CURRENT_TIMESTAMP WHERE "id" = ${id}`
}

export async function deleteTemplate(id: string): Promise<void> {
  await prisma.$executeRaw`DELETE FROM "gz_post_templates" WHERE "id" = ${id}`
}
