'use client'

import { Children, cloneElement, isValidElement, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { Puck } from '@puckeditor/core'
import type { Config, Data } from '@puckeditor/core'
import '@puckeditor/core/no-external.css'
import '@/lib/puck/tabs/sidebarOverrides.css'
import { createTabbedFieldsOverride } from '@/lib/puck/tabs/TabbedFieldsOverride'
import { createBackLinkOverride } from '@/lib/puck/tabs/headerBackLinkOverride'
import { EditorDirtyProvider, useEditorDirtyState } from '@/lib/puck/tabs/editorDirtyState'
import OutlineTree from '@/lib/puck/outline/OutlineTree'
import { useAdminPath } from '@/components/admin/AdminPathContext'
import { bodyEditorConfig } from '@/modules/gazette/components/puck/body/bodyEditorConfig'
import type { GazettePost, GazetteTag, GazetteSeries, PostUrlStyle, PuckData } from '@/modules/gazette/lib/types'
import type { AuthorListItem } from '@/modules/gazette/lib/db'
import {
  EDITOR_BEFORE_PUBLISH_EVENT, EDITOR_STATE_EVENT,
  type GazetteBeforePublishDetail, type GazetteEditorPanelPost,
} from '@/modules/gazette/lib/editor-panels'
import { buildPostRootFields } from './PostSettingsFields'
import { PostEditorProvider, usePostEditor, type PostEditorFields, type PostPublishAction } from './postEditorContext'

type Props = {
  post: GazettePost & { tagIds: string[] }
  tags: GazetteTag[]
  series: GazetteSeries[]
  authors: AuthorListItem[]
  currentUserId: string
  canPublish: boolean
  canReassignAuthor: boolean
  canSaveTemplate: boolean
  postUrlStyle: PostUrlStyle
  /** Cards other modules add to the sidebar (`gazette.post-editor-panels`), already rendered by the page. */
  panels?: ReactNode[]
  /** The site's own address, so the panels are told the post's real public URL. */
  siteBase?: string
  /** The featured image's address as the page loaded it, handed on to the panels. */
  initialImageUrl?: string | null
}

const AUTOSAVE_DEBOUNCE_MS = 1500

const EMPTY_BODY: PuckData = { root: { props: {} }, content: [], zones: {} }

/** A saved date as the local "YYYY-MM-DDTHH:mm" a datetime-local input wants. */
function toLocalInputValue(value: Date | string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** The fields as the API takes them: empty strings become null, the author only for those allowed to change it. */
function toSaveBody(fields: PostEditorFields, builderData: PuckData, canReassignAuthor: boolean) {
  return {
    title: fields.title,
    slug: fields.slug,
    excerpt: fields.excerpt || null,
    builderData,
    featuredImageId: fields.featuredImageId || null,
    ...(canReassignAuthor ? { authorId: fields.authorId } : {}),
    seriesId: fields.seriesId || null,
    seriesOrder: fields.seriesId && fields.seriesOrder !== '' ? Number(fields.seriesOrder) : null,
    tagIds: fields.tagIds,
    seoTitle: fields.seoTitle || null,
    seoDescription: fields.seoDescription || null,
    canonicalUrl: fields.canonicalUrl || null,
    isPinned: fields.isPinned,
    isPrivate: fields.isPrivate,
  }
}

// Puck's own Update button sits in the header's action area. Preview goes beside
// it, and the button greys out when there is nothing unsaved. That button renders
// as a <span> with no real disabled state, so a click is swallowed in the capture
// phase when it should do nothing.
function PostHeaderActions({ children }: { children: ReactNode }) {
  const { canUpdate } = useEditorDirtyState()
  const { openPreview } = usePostEditor()
  const updateButton = Children.map(children, (child) => (
    isValidElement<{ disabled?: boolean }>(child) ? cloneElement(child, { disabled: !canUpdate }) : child
  ))
  const swallowClickWhenDisabled = (e: MouseEvent) => {
    if (!canUpdate) { e.preventDefault(); e.stopPropagation() }
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <button type="button" className="btn btn-secondary" style={{ fontSize: '0.8125rem', padding: '0.4rem 0.75rem' }} onClick={openPreview}>
        Preview
      </button>
      <span
        onClickCapture={swallowClickWhenDisabled}
        aria-disabled={!canUpdate}
        title={canUpdate ? undefined : 'Everything is saved'}
        style={{ display: 'inline-flex' }}
      >
        {updateButton}
      </span>
    </div>
  )
}

export default function PostEditor({ post, tags, series, authors, currentUserId, canPublish, canReassignAuthor, canSaveTemplate, postUrlStyle, panels = [], siteBase = '', initialImageUrl = null }: Props) {
  const adminPath = useAdminPath()
  const backHref = `/${adminPath}/m/gazette/posts`

  const initialBody = post.builderData ?? EMPTY_BODY
  const [fields, setFields] = useState<PostEditorFields>(() => ({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? '',
    featuredImageId: post.featuredImageId ?? '',
    authorId: post.authorId ?? currentUserId,
    seriesId: post.seriesId ?? '',
    seriesOrder: post.seriesOrder ?? '',
    tagIds: post.tagIds,
    seoTitle: post.seoTitle ?? '',
    seoDescription: post.seoDescription ?? '',
    canonicalUrl: post.canonicalUrl ?? '',
    isPinned: post.isPinned,
    isPrivate: post.isPrivate,
  }))

  const [status, setStatus] = useState(post.status)
  const [publishedAt, setPublishedAt] = useState(post.publishedAt)
  const [scheduledFor, setScheduledFor] = useState(post.scheduledFor)
  const [scheduleInput, setScheduleInput] = useState(() => toLocalInputValue(post.scheduledFor))

  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveError, setSaveError] = useState('')
  const [dirty, setDirty] = useState(false)
  const [publishBusy, setPublishBusy] = useState(false)
  const [publishError, setPublishError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [templateSaved, setTemplateSaved] = useState(false)

  // What the next save sends. Held in refs as well as state so a change made in
  // the same tick as another, or a save fired from a timer, never reads a render's
  // stale copy of the post.
  const fieldsRef = useRef(fields)
  const bodyRef = useRef<PuckData>(initialBody)
  const bodySnapshotRef = useRef(JSON.stringify(initialBody))
  const changeCountRef = useRef(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialImageIdRef = useRef(post.featuredImageId ?? '')

  const canvasWrapRef = useRef<HTMLDivElement>(null)
  const [canvasReady, setCanvasReady] = useState(false)

  // Puck measures its wrapper on mount to size the canvas; mounted while the
  // wrapper is still 0x0 it divides by zero and logs a transient NaN height.
  // Wait for a real measured size first (the layout and page editors do too).
  useEffect(() => {
    const el = canvasWrapRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) { setCanvasReady(true); observer.disconnect() }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Keep the sidebar panels told what the post looks like now. Child effects run
  // before this one, so every panel is already listening on the first send.
  useEffect(() => {
    if (panels.length === 0) return
    const live = status === 'SCHEDULED' ? scheduledFor : publishedAt
    const detail: GazetteEditorPanelPost = {
      id: post.id,
      title: fields.title,
      excerpt: fields.excerpt || null,
      // Same rule as lib/post-url's postHref, which this browser file cannot import (it reaches the database).
      url: `${siteBase}${postUrlStyle === 'ROOT' ? '/' : '/gazette/'}${fields.slug}`,
      // Only the id is known here once the image is changed; the panels get the
      // real address from the server again when the post is published.
      imageUrl: fields.featuredImageId && fields.featuredImageId === initialImageIdRef.current ? initialImageUrl : null,
      status,
      liveAt: live ? new Date(live).toISOString() : null,
      isPrivate: fields.isPrivate,
    }
    window.dispatchEvent(new CustomEvent(EDITOR_STATE_EVENT, { detail }))
  }, [panels.length, post.id, fields.title, fields.excerpt, fields.slug, postUrlStyle, siteBase, fields.featuredImageId, initialImageUrl, status, scheduledFor, publishedAt, fields.isPrivate])

  const doSave = useCallback(async (): Promise<boolean> => {
    if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null }
    const sentAt = changeCountRef.current
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch(`/api/m/gazette/admin/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSaveBody(fieldsRef.current, bodyRef.current, canReassignAuthor)),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null) as { error?: string } | null
        setSaveError(data?.error ?? 'Could not save. Your changes are still here; try again.')
        return false
      }
      const data = await res.json().catch(() => null) as { slug?: string } | null
      // The address can come back different: a slug already taken is made unique on the server.
      if (data?.slug && data.slug !== fieldsRef.current.slug) {
        fieldsRef.current = { ...fieldsRef.current, slug: data.slug }
        setFields(fieldsRef.current)
      }
      setLastSaved(new Date())
      // Only clean if nothing changed while the request was out.
      if (changeCountRef.current === sentAt) setDirty(false)
      return true
    } catch {
      setSaveError('Could not save. Check your connection; your changes are still here.')
      return false
    } finally {
      setSaving(false)
    }
  }, [post.id, canReassignAuthor])

  const markChanged = useCallback(() => {
    changeCountRef.current += 1
    setDirty(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { void doSave() }, AUTOSAVE_DEBOUNCE_MS)
  }, [doSave])

  const update = useCallback((patch: Partial<PostEditorFields>) => {
    fieldsRef.current = { ...fieldsRef.current, ...patch }
    setFields(fieldsRef.current)
    markChanged()
  }, [markChanged])

  const handleBuilderChange = useCallback((data: Data) => {
    // Puck reports the loaded content once on mount; only a real difference is an edit.
    if (JSON.stringify(data) === bodySnapshotRef.current) return
    bodySnapshotRef.current = JSON.stringify(data)
    bodyRef.current = data as unknown as PuckData
    markChanged()
  }, [markChanged])

  const saveNow = useCallback(() => { void doSave() }, [doSave])

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        void doSave()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [doSave])

  // Content only reaches the server a moment after a change, so a real
  // navigation away in that gap would lose it.
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  // Let every sidebar panel save what it is holding before the post goes. A
  // panel that refuses (a social post too long, say) stops the publish.
  async function panelsReady(action: 'publish' | 'schedule', liveAt: string | null): Promise<string | null> {
    if (panels.length === 0) return null
    const work: Promise<unknown>[] = []
    const detail: GazetteBeforePublishDetail = { action, liveAt, waitFor: (p) => { work.push(p) } }
    window.dispatchEvent(new CustomEvent(EDITOR_BEFORE_PUBLISH_EVENT, { detail }))
    const results = await Promise.allSettled(work)
    const refused = results.find((r): r is PromiseRejectedResult => r.status === 'rejected')
    if (!refused) return null
    return refused.reason instanceof Error ? refused.reason.message : String(refused.reason)
  }

  async function publishAction(action: PostPublishAction) {
    setPublishBusy(true)
    setPublishError('')
    const body: Record<string, unknown> = { action }
    if (action === 'schedule') {
      if (!scheduleInput) { setPublishBusy(false); return }
      body.scheduledFor = new Date(scheduleInput).toISOString()
    }
    if (action !== 'unpublish') {
      // The post's own pending edits first, so whatever is told it has gone live sees the saved title and address.
      if (dirty && !(await doSave())) {
        setPublishError('Could not save the post first, so nothing was published.')
        setPublishBusy(false)
        return
      }
      const problem = await panelsReady(action, action === 'schedule' ? (body.scheduledFor as string) : new Date().toISOString())
      if (problem) { setPublishError(problem); setPublishBusy(false); return }
    }
    const res = await fetch(`/api/m/gazette/admin/posts/${post.id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      if (action === 'publish') { setStatus('PUBLISHED'); setPublishedAt(new Date()); setScheduledFor(null) }
      else if (action === 'schedule') { setStatus('SCHEDULED'); setScheduledFor(new Date(scheduleInput)) }
      else { setStatus('DRAFT'); setScheduledFor(null) }
    } else {
      const data = await res.json().catch(() => null) as { error?: string } | null
      setPublishError(data?.error ?? 'Could not change the post. Try again.')
    }
    setPublishBusy(false)
  }

  async function fetchPreviewUrl(): Promise<string | null> {
    const res = await fetch(`/api/m/gazette/admin/posts/${post.id}/preview-token`, { method: 'POST' }).catch(() => null)
    const data = res?.ok ? await res.json().catch(() => null) as { url?: string } | null : null
    return data?.url ? `${window.location.origin}${data.url}` : null
  }

  async function openPreview() {
    // Opened first, on the click itself: a window opened after the fetch is a popup the browser blocks.
    const tab = window.open('', '_blank')
    if (dirty) await doSave()
    const url = await fetchPreviewUrl()
    if (!url) { tab?.close(); setPublishError('Could not make a preview link. Try again.'); return }
    if (tab) tab.location.href = url
    else window.open(url, '_blank')
  }

  async function copyPreviewLink() {
    const url = await fetchPreviewUrl()
    if (!url) return
    setPreviewUrl(url)
    try { await navigator.clipboard.writeText(url) } catch { /* clipboard unavailable */ }
  }

  async function saveAsTemplate() {
    const res = await fetch('/api/m/gazette/admin/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: fieldsRef.current.title, builderData: bodyRef.current }),
    }).catch(() => null)
    if (!res?.ok) {
      alert('Could not save this post as a template.')
      return
    }
    setTemplateSaved(true)
    setTimeout(() => setTemplateSaved(false), 2000)
  }

  const hasPanels = panels.length > 0
  const editorConfig = useMemo(() => {
    const { fields: rootFields, fieldTabs } = buildPostRootFields({ hasPanels, canReassignAuthor })
    return { ...bodyEditorConfig, root: { fields: rootFields, fieldTabs } } as unknown as Config
  }, [hasPanels, canReassignAuthor])

  const puckOverrides = useMemo(() => ({
    header: createBackLinkOverride(backHref, 'Back to posts'),
    headerActions: PostHeaderActions,
    fields: createTabbedFieldsOverride(),
    outline: OutlineTree,
  }), [backHref])

  const dirtyState = useMemo(() => ({ hasUnsavedChanges: dirty, canUpdate: dirty }), [dirty])

  const editorContext = {
    fields, update, tags, series, authors, canPublish, canReassignAuthor, canSaveTemplate, postUrlStyle, siteBase, panels,
    status, saving, lastSaved, saveError, publishBusy, publishError, scheduleInput, setScheduleInput, previewUrl, templateSaved,
    saveNow, publishAction: (action: PostPublishAction) => { void publishAction(action) },
    openPreview: () => { void openPreview() }, copyPreviewLink: () => { void copyPreviewLink() }, saveAsTemplate: () => { void saveAsTemplate() },
  }

  return (
    <EditorDirtyProvider value={dirtyState}>
      <PostEditorProvider value={editorContext}>
        {/* The marker class tells the admin shell this screen is a full-viewport Puck editor (see globals.css). */}
        <div className="admin-puck-fullbleed" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div ref={canvasWrapRef} style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {canvasReady && (
              <Puck
                config={editorConfig}
                overrides={puckOverrides}
                data={initialBody as unknown as Data}
                onChange={handleBuilderChange}
                onPublish={saveNow}
                headerTitle={fields.title || 'Untitled post'}
                iframe={{ enabled: false }}
              />
            )}
          </div>
        </div>
      </PostEditorProvider>
    </EditorDirtyProvider>
  )
}
