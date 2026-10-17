import { prisma } from '@/lib/db/prisma'
import { INSTALLED_MODULE_WHERE } from '@/lib/modules/live-status'
import { moduleServerExtensionPointComponents } from '@/lib/modules/extension-points.server'
import { getPostById } from './db'
import { getPostUrlStyle, postUrl } from './post-url'
import { siteUrl } from './site-url'
import type { GazetteEditorPanelPost } from './editor-panels'

// `gazette.post-status-changed`: told whenever a post is published, scheduled,
// taken back to draft or deleted, so another module can do something of its own
// at the moment the post goes (or stops going) live. Gazette has no cron for
// scheduled posts - they simply become visible once their time passes - so a
// listener that wants to act "when it goes live" is handed the time and does its
// own scheduling.
//
// A listener NEVER fails the change that caused it. The post has already been
// published; a broken or slow listener is logged and the editor carries on.

export type GazettePostStatusAction = 'publish' | 'schedule' | 'unpublish' | 'delete'

export type GazettePostStatusChange = {
  action: GazettePostStatusAction
  /** Null on delete: the post is gone and only its id remains. */
  post: GazetteEditorPanelPost | null
  postId: string
}

export type GazettePostStatusListener = (change: GazettePostStatusChange) => Promise<void> | void

const POINT = 'gazette.post-status-changed'

type ExtensionPointEntry = { point: string; id: string }

async function listeners(): Promise<{ id: string; fn: GazettePostStatusListener }[]> {
  const fns = moduleServerExtensionPointComponents[POINT] ?? {}
  if (Object.keys(fns).length === 0) return []
  const modules = await prisma.module.findMany({ where: { ...INSTALLED_MODULE_WHERE }, select: { manifest: true } })
  const out: { id: string; fn: GazettePostStatusListener }[] = []
  for (const mod of modules) {
    const manifest = mod.manifest as { extensionPoints?: ExtensionPointEntry[] } | null
    for (const entry of manifest?.extensionPoints ?? []) {
      if (entry.point !== POINT) continue
      const fn = fns[entry.id] as GazettePostStatusListener | undefined
      if (fn) out.push({ id: entry.id, fn })
    }
  }
  return out
}

/** The post as a listener (or an editor panel) sees it: flat, JSON-safe, public address worked out. */
export async function editorPanelPost(id: string): Promise<GazetteEditorPanelPost | null> {
  const post = await getPostById(id)
  if (!post) return null
  const [style, image] = await Promise.all([
    getPostUrlStyle(),
    post.featuredImageId
      ? prisma.media.findUnique({ where: { id: post.featuredImageId }, select: { url: true } })
      : Promise.resolve(null),
  ])
  return {
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    url: postUrl(siteUrl(), post.slug, style),
    imageUrl: image?.url ?? null,
    status: post.status,
    liveAt: (post.status === 'SCHEDULED' ? post.scheduledFor : post.publishedAt)?.toISOString() ?? null,
    isPrivate: post.isPrivate,
  }
}

/** Tell every listener. Call AFTER the change is saved; never throws. */
export async function announcePostStatus(postId: string, action: GazettePostStatusAction): Promise<void> {
  try {
    const found = await listeners()
    if (found.length === 0) return
    const post = action === 'delete' ? null : await editorPanelPost(postId)
    for (const { id, fn } of found) {
      try {
        await fn({ action, post, postId })
      } catch (error) {
        console.error(`[gazette] post-status listener "${id}" failed for ${postId}:`, error instanceof Error ? error.message : error)
      }
    }
  } catch (error) {
    console.error('[gazette] could not announce a post status change:', error instanceof Error ? error.message : error)
  }
}
