import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/auth/session'
import { errorResponse } from '@/lib/utils'
import { getGazetteAccess } from '@/modules/gazette/lib/permissions'
import { prisma } from '@/lib/db/prisma'
import { createPost, setImportedPublishedAt, getOrCreateTagsByName, setPostTags, findPostBySlugExact } from '@/modules/gazette/lib/db'
import { slugifyTitle, ensureUniquePostSlug } from '@/modules/gazette/lib/slug'
import { htmlToBuilderData } from '@/modules/gazette/lib/import/convert'
import { parseWordPressXml } from '@/modules/gazette/lib/import/wordpress'
import { parseMediumHtmlFiles } from '@/modules/gazette/lib/import/medium'
import { parseSubstackCsv } from '@/modules/gazette/lib/import/substack'
import type { ParsedImportPost, ImportPreviewRow } from '@/modules/gazette/lib/import/types'

// No maxDuration here on purpose. Module routes are reached through the core
// dispatcher (app/api/m/[module]/[...path]/route.ts), and Next only reads the
// setting off the route file it actually compiles - which is the dispatcher's,
// fixed at 60s. An export here read as though it set the ceiling for this import
// while doing nothing at all, so raising it for a big archive would have failed
// silently. Long imports have to be broken up, not given a bigger number.

async function readFileText(file: File): Promise<string> {
  return Buffer.from(await file.arrayBuffer()).toString('utf-8')
}

export async function POST(request: NextRequest) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!access.isEditor) return errorResponse('Forbidden', 403)

  const formData = await request.formData()
  const type = formData.get('type')
  const dryRun = formData.get('dryRun') === 'true'
  const files = formData.getAll('files').filter((f): f is File => f instanceof File)

  let parsed: ParsedImportPost[] = []

  if (type === 'wordpress') {
    const file = files[0]
    if (!file) return errorResponse('Upload the exported WXR XML file')
    parsed = parseWordPressXml(await readFileText(file))
  } else if (type === 'medium') {
    if (files.length === 0) return errorResponse('Upload the extracted post HTML files')
    const contents = await Promise.all(files.map(async (f) => ({ filename: f.name, content: await readFileText(f) })))
    parsed = parseMediumHtmlFiles(contents)
  } else if (type === 'substack') {
    const csvFile = files.find((f) => f.name.toLowerCase().endsWith('.csv'))
    if (!csvFile) return errorResponse('Upload posts.csv from the Substack export')
    const htmlFiles = files.filter((f) => f !== csvFile)
    const htmlByPostId = new Map<string, string>()
    for (const f of htmlFiles) {
      const match = f.name.match(/^([^_.]+)/)
      if (match) htmlByPostId.set(match[1]!, await readFileText(f))
    }
    parsed = parseSubstackCsv(await readFileText(csvFile), htmlByPostId)
  } else {
    return errorResponse('Unknown import type')
  }

  // Resolve authors by email against core Users, in one batch.
  const emails = [...new Set(parsed.map((p) => p.authorEmail).filter((e): e is string => !!e))]
  const users = emails.length
    ? await prisma.user.findMany({ where: { email: { in: emails } }, select: { id: true, email: true, displayName: true, username: true } })
    : []
  const userByEmail = new Map(users.map((u) => [u.email, u]))

  const preview: ImportPreviewRow[] = []
  let imported = 0
  let skipped = 0

  for (const post of parsed) {
    const slug = await ensureUniquePostSlug(slugifyTitle(post.title))
    const existing = await findPostBySlugExact(slug)
    // ensureUniquePostSlug never returns a slug that collides UNLESS the base slug
    // itself is already unique from any pass - so re-check the raw base slug for
    // true duplicate detection (same title imported twice).
    const baseSlug = slugifyTitle(post.title)
    const duplicate = await findPostBySlugExact(baseSlug)
    const action: 'Import' | 'Skip' = duplicate ? 'Skip' : 'Import'
    const matchedUser = post.authorEmail ? userByEmail.get(post.authorEmail) : undefined

    preview.push({
      title: post.title,
      slug: duplicate ? baseSlug : slug,
      tags: post.tags,
      authorMatch: matchedUser ? (matchedUser.displayName ?? matchedUser.username) : (post.importedAuthorName ?? 'Unmatched'),
      action,
    })

    if (dryRun || action === 'Skip') {
      if (action === 'Skip') skipped++
      continue
    }

    const builderData = htmlToBuilderData(post.bodyHtml)
    const created = await createPost({
      title: post.title,
      slug: duplicate ? slug : baseSlug,
      authorId: matchedUser?.id ?? null,
      templateBuilderData: builderData,
    })

    if (post.excerpt) {
      await prisma.$executeRaw`UPDATE "gz_posts" SET "excerpt" = ${post.excerpt} WHERE "id" = ${created.id}`
    }
    if (post.publishedAt) {
      await setImportedPublishedAt(created.id, post.publishedAt, matchedUser ? null : post.importedAuthorName)
    }
    if (post.tags.length > 0) {
      const tagIds = await getOrCreateTagsByName(post.tags)
      await setPostTags(created.id, tagIds)
    }

    imported++
  }

  if (dryRun) {
    return NextResponse.json({ preview })
  }

  return NextResponse.json({
    imported, skipped,
    summary: `${imported} posts imported. ${skipped} skipped (duplicates by slug).`,
  })
}
