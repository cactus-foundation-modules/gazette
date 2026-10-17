import { createContext, useContext, type ReactNode } from 'react'
import type { GazetteSeries, GazetteTag, PostStatus, PostUrlStyle } from '@/modules/gazette/lib/types'
import type { AuthorListItem } from '@/modules/gazette/lib/db'

// Everything the post editor's "Page" pane needs. The pane is Puck's root fields,
// and a Puck field is a render function with no props of ours, so the editor hands
// the live post to those fields through this context instead. Plain file, no
// 'use client': the editor and the field components both read it.

/** The post's own settings, as the editor holds them while they are being changed. */
export type PostEditorFields = {
  title: string
  slug: string
  excerpt: string
  featuredImageId: string
  authorId: string
  seriesId: string
  seriesOrder: number | ''
  tagIds: string[]
  seoTitle: string
  seoDescription: string
  canonicalUrl: string
  isPinned: boolean
  isPrivate: boolean
}

export type PostPublishAction = 'publish' | 'schedule' | 'unpublish'

export type PostEditorContextValue = {
  fields: PostEditorFields
  update: (patch: Partial<PostEditorFields>) => void

  tags: GazetteTag[]
  series: GazetteSeries[]
  authors: AuthorListItem[]
  canPublish: boolean
  canReassignAuthor: boolean
  canSaveTemplate: boolean
  postUrlStyle: PostUrlStyle
  siteBase: string
  /** Cards other modules add to the sidebar (`gazette.post-editor-panels`), already rendered by the page. */
  panels: ReactNode[]

  status: PostStatus
  saving: boolean
  lastSaved: Date | null
  saveError: string
  publishBusy: boolean
  publishError: string
  scheduleInput: string
  setScheduleInput: (value: string) => void
  previewUrl: string | null
  templateSaved: boolean

  saveNow: () => void
  publishAction: (action: PostPublishAction) => void
  openPreview: () => void
  copyPreviewLink: () => void
  saveAsTemplate: () => void
}

const PostEditorContext = createContext<PostEditorContextValue | null>(null)

export const PostEditorProvider = PostEditorContext.Provider

export function usePostEditor(): PostEditorContextValue {
  const value = useContext(PostEditorContext)
  if (!value) throw new Error('usePostEditor must be used inside the post editor')
  return value
}
