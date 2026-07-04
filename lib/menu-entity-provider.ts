import { prisma } from '@/lib/db/prisma'
import type { MenuEntityKind, MenuEntitySearchResult, MenuEntityProvider, ResolvedMenuEntity } from '@/lib/modules/menu-entity-provider'

// Contributes to the "core.menu-entity-provider" extension point so the admin
// menu builder can link to Gazette content.
const KINDS: MenuEntityKind[] = [
  { id: 'home', label: 'Gazette home page' },
  { id: 'post', label: 'Post' },
  { id: 'tag', label: 'Tag' },
  { id: 'series', label: 'Series' },
  { id: 'author', label: 'Author' },
]

function listKinds(): MenuEntityKind[] {
  return KINDS
}

async function searchEntities(kind: string, query: string): Promise<MenuEntitySearchResult[]> {
  const q = `%${query}%`
  if (kind === 'home') {
    return [{ id: 'home', label: 'Gazette home page' }]
  }
  if (kind === 'post') {
    const rows = await prisma.$queryRaw<Array<{ id: string; title: string; status: string }>>`
      SELECT "id", "title", "status" FROM "gz_posts" WHERE "title" ILIKE ${q} ORDER BY "created_at" DESC LIMIT 20
    `
    return rows.map((r) => ({ id: r.id, label: r.title, hint: r.status !== 'PUBLISHED' ? r.status : undefined }))
  }
  if (kind === 'tag') {
    const rows = await prisma.$queryRaw<Array<{ id: string; name: string }>>`
      SELECT "id", "name" FROM "gz_tags" WHERE "name" ILIKE ${q} ORDER BY "name" ASC LIMIT 20
    `
    return rows.map((r) => ({ id: r.id, label: r.name }))
  }
  if (kind === 'series') {
    const rows = await prisma.$queryRaw<Array<{ id: string; title: string }>>`
      SELECT "id", "title" FROM "gz_series" WHERE "title" ILIKE ${q} ORDER BY "title" ASC LIMIT 20
    `
    return rows.map((r) => ({ id: r.id, label: r.title }))
  }
  if (kind === 'author') {
    const rows = await prisma.$queryRaw<Array<{ id: string; username: string; display_name: string | null }>>`
      SELECT ap."id", u."username", u."displayName" AS display_name
      FROM "gz_author_profiles" ap JOIN "User" u ON u."id" = ap."user_id"
      WHERE u."username" ILIKE ${q} OR u."displayName" ILIKE ${q}
      ORDER BY u."username" ASC LIMIT 20
    `
    return rows.map((r) => ({ id: r.id, label: r.display_name ?? r.username, hint: r.username }))
  }
  return []
}

async function resolveEntity(kind: string, id: string): Promise<ResolvedMenuEntity | null> {
  if (kind === 'home') {
    return { label: 'Gazette', href: '/gazette', publiclyVisible: true }
  }
  if (kind === 'post') {
    const rows = await prisma.$queryRaw<Array<{
      title: string; slug: string; status: string; published_at: Date | null; scheduled_for: Date | null; is_private: boolean
    }>>`
      SELECT "title", "slug", "status", "published_at", "scheduled_for", "is_private" FROM "gz_posts" WHERE "id" = ${id} LIMIT 1
    `
    const post = rows[0]
    if (!post) return null
    const now = Date.now()
    const publiclyVisible =
      !post.is_private &&
      ((post.status === 'PUBLISHED' && !!post.published_at && post.published_at.getTime() <= now) ||
        (post.status === 'SCHEDULED' && !!post.scheduled_for && post.scheduled_for.getTime() <= now))
    return { label: post.title, href: `/gazette/${post.slug}`, publiclyVisible }
  }
  if (kind === 'tag') {
    const rows = await prisma.$queryRaw<Array<{ name: string; slug: string }>>`SELECT "name", "slug" FROM "gz_tags" WHERE "id" = ${id} LIMIT 1`
    if (!rows[0]) return null
    return { label: rows[0].name, href: `/gazette/tag/${rows[0].slug}`, publiclyVisible: true }
  }
  if (kind === 'series') {
    const rows = await prisma.$queryRaw<Array<{ title: string; slug: string }>>`SELECT "title", "slug" FROM "gz_series" WHERE "id" = ${id} LIMIT 1`
    if (!rows[0]) return null
    return { label: rows[0].title, href: `/gazette/series/${rows[0].slug}`, publiclyVisible: true }
  }
  if (kind === 'author') {
    const rows = await prisma.$queryRaw<Array<{ username: string; display_name: string | null }>>`
      SELECT u."username", u."displayName" AS display_name
      FROM "gz_author_profiles" ap JOIN "User" u ON u."id" = ap."user_id"
      WHERE ap."id" = ${id} LIMIT 1
    `
    if (!rows[0]) return null
    return { label: rows[0].display_name ?? rows[0].username, href: `/gazette/author/${rows[0].username}`, publiclyVisible: true }
  }
  return null
}

export const gazetteMenuEntityProvider: MenuEntityProvider = {
  moduleLabel: 'Gazette',
  listKinds,
  searchEntities,
  resolveEntity,
}
