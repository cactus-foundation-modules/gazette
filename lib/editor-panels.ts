import type { PostStatus } from './types'

// `gazette.post-editor-panels`: a card another module can put in the post
// editor's sidebar, under Publish. The edit page renders each one on the server
// with `{ post }` (below) and the editor keeps it up to date in the browser by
// events on `window`, because a contributing module has to build on a site with
// no Gazette and so cannot import anything from here. Its own copy of these
// shapes is the contract; keep the two in step.
//
// Plain file, no 'use client' and no server imports: the server page, the
// server-side event and the browser editor all read it.

export type GazetteEditorPanelPost = {
  id: string
  title: string
  excerpt: string | null
  /** The post's full public address. */
  url: string
  /** The featured image's address (may be site-relative), or null. */
  imageUrl: string | null
  status: PostStatus
  /** When it went, or is due to go, live. Null for a draft never published. */
  liveAt: string | null
  /** Members-only: there is no public address worth sharing. */
  isPrivate: boolean
}

/** Fired on every change the editor makes to the post. `detail` is a GazetteEditorPanelPost. */
export const EDITOR_STATE_EVENT = 'gazette:post-editor-state'

/**
 * Fired just before the editor publishes or schedules, so a panel can save what
 * it is holding first. `detail.waitFor(promise)` makes the editor wait for it;
 * a promise that REJECTS stops the publish, and its message is shown.
 */
export const EDITOR_BEFORE_PUBLISH_EVENT = 'gazette:post-editor-before-publish'

export type GazetteBeforePublishDetail = {
  action: 'publish' | 'schedule'
  /** The time it will go live, for a schedule. */
  liveAt: string | null
  waitFor: (work: Promise<unknown>) => void
}
