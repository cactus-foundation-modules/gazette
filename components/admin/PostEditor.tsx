'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Puck } from '@puckeditor/core'
import type { Data, CustomField } from '@puckeditor/core'
import '@puckeditor/core/no-external.css'
import { tabbedFieldsOverride } from '@/lib/puck/tabs/TabbedFieldsOverride'
import { bodyEditorConfig } from '@/modules/gazette/components/puck/body/bodyEditorConfig'
import { OgImagePickerField } from '@/lib/puck/MediaPickerField'
import TagMultiSelect from './TagMultiSelect'
import type { GazettePost, GazetteTag, GazetteSeries, PostUrlStyle, PuckData } from '@/modules/gazette/lib/types'
import type { AuthorListItem } from '@/modules/gazette/lib/db'
import {
  EDITOR_BEFORE_PUBLISH_EVENT, EDITOR_STATE_EVENT,
  type GazetteBeforePublishDetail, type GazetteEditorPanelPost,
} from '@/modules/gazette/lib/editor-panels'

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

// Module-level so Puck sees the same override object on every render.
const PUCK_OVERRIDES = { fields: tabbedFieldsOverride }

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 100)
}

export default function PostEditor({ post, tags, series, authors, currentUserId, canPublish, canReassignAuthor, canSaveTemplate, postUrlStyle, panels = [], siteBase = '', initialImageUrl = null }: Props) {
  const [title, setTitle] = useState(post.title)
  const [slug, setSlug] = useState(post.slug)
  const [slugTouched, setSlugTouched] = useState(true)
  const [excerpt, setExcerpt] = useState(post.excerpt ?? '')
  const [builderData, setBuilderData] = useState<PuckData>(post.builderData ?? { root: { props: {} }, content: [], zones: {} })
  const [featuredImageId, setFeaturedImageId] = useState(post.featuredImageId ?? '')
  const [authorId, setAuthorId] = useState(post.authorId ?? currentUserId)
  const [seriesId, setSeriesId] = useState(post.seriesId ?? '')
  const [seriesOrder, setSeriesOrder] = useState<number | ''>(post.seriesOrder ?? '')
  const [tagIds, setTagIds] = useState<string[]>(post.tagIds)
  const [allTags, setAllTags] = useState(tags)
  const [seoTitle, setSeoTitle] = useState(post.seoTitle ?? '')
  const [seoDescription, setSeoDescription] = useState(post.seoDescription ?? '')
  const [canonicalUrl, setCanonicalUrl] = useState(post.canonicalUrl ?? '')
  const [isPinned, setIsPinned] = useState(post.isPinned)
  const [isPrivate, setIsPrivate] = useState(post.isPrivate)

  const [status, setStatus] = useState(post.status)
  const [publishedAt, setPublishedAt] = useState(post.publishedAt)
  const [scheduledFor, setScheduledFor] = useState(post.scheduledFor)
  const [scheduleInput, setScheduleInput] = useState('')

  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [publishBusy, setPublishBusy] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [templateSaved, setTemplateSaved] = useState(false)

  const [publishError, setPublishError] = useState('')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialImageIdRef = useRef(post.featuredImageId ?? '')

  // Keep the sidebar panels told what the post looks like now. Child effects run
  // before this one, so every panel is already listening on the first send.
  useEffect(() => {
    if (panels.length === 0) return
    const live = status === 'SCHEDULED' ? scheduledFor : publishedAt
    const detail: GazetteEditorPanelPost = {
      id: post.id,
      title,
      excerpt: excerpt || null,
      // Same rule as lib/post-url's postHref, which this browser file cannot import (it reaches the database).
      url: `${siteBase}${postUrlStyle === 'ROOT' ? '/' : '/gazette/'}${slug}`,
      // Only the id is known here once the image is changed; the panels get the
      // real address from the server again when the post is published.
      imageUrl: featuredImageId && featuredImageId === initialImageIdRef.current ? initialImageUrl : null,
      status,
      liveAt: live ? new Date(live).toISOString() : null,
      isPrivate,
    }
    window.dispatchEvent(new CustomEvent(EDITOR_STATE_EVENT, { detail }))
  }, [panels.length, post.id, title, excerpt, slug, postUrlStyle, siteBase, featuredImageId, initialImageUrl, status, scheduledFor, publishedAt, isPrivate])

  const doAutosave = useCallback(async (fields: Record<string, unknown>) => {
    setSaving(true)
    await fetch(`/api/m/gazette/admin/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    setSaving(false)
    setLastSaved(new Date())
  }, [post.id])

  const scheduleAutosave = useCallback((fields: Record<string, unknown>) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doAutosave(fields), AUTOSAVE_DEBOUNCE_MS)
  }, [doAutosave])

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  function currentFields() {
    return {
      title, slug, excerpt: excerpt || null, builderData, featuredImageId: featuredImageId || null,
      ...(canReassignAuthor ? { authorId } : {}),
      seriesId: seriesId || null, seriesOrder: seriesId && seriesOrder !== '' ? Number(seriesOrder) : null,
      tagIds, seoTitle: seoTitle || null, seoDescription: seoDescription || null, canonicalUrl: canonicalUrl || null,
      isPinned, isPrivate,
    }
  }

  function onFieldChange() {
    scheduleAutosave(currentFields())
  }

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slugTouched) setSlug(slugify(value))
    scheduleAutosave({ ...currentFields(), title: value, slug: slugTouched ? slug : slugify(value) })
  }

  function handleBuilderChange(data: Data) {
    setBuilderData(data as unknown as PuckData)
    scheduleAutosave({ ...currentFields(), builderData: data })
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (debounceRef.current) clearTimeout(debounceRef.current)
        doAutosave(currentFields())
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
     
  })

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

  async function publishAction(action: 'publish' | 'schedule' | 'unpublish') {
    setPublishBusy(true)
    setPublishError('')
    const body: Record<string, unknown> = { action }
    if (action === 'schedule') {
      if (!scheduleInput) { setPublishBusy(false); return }
      body.scheduledFor = new Date(scheduleInput).toISOString()
    }
    if (action !== 'unpublish') {
      // The post's own pending edits first, so whatever is told it has gone live sees the saved title and address.
      if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null; await doAutosave(currentFields()) }
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

  async function copyPreviewLink() {
    const res = await fetch(`/api/m/gazette/admin/posts/${post.id}/preview-token`, { method: 'POST' })
    const data = await res.json()
    if (data?.url) {
      const fullUrl = `${window.location.origin}${data.url}`
      setPreviewUrl(fullUrl)
      try { await navigator.clipboard.writeText(fullUrl) } catch { /* clipboard unavailable */ }
    }
  }

  async function saveAsTemplate() {
    const res = await fetch('/api/m/gazette/admin/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, builderData }),
    }).catch(() => null)
    if (!res?.ok) {
      alert('Could not save this post as a template.')
      return
    }
    setTemplateSaved(true)
    setTimeout(() => setTemplateSaved(false), 2000)
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: '1.5rem', overflow: 'hidden' }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', paddingRight: '0.5rem' }}>
        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          autoFocus
          placeholder="Post title"
          style={{ fontSize: '1.75rem', fontWeight: 700, border: 'none', outline: 'none', background: 'transparent', color: 'var(--color-text)', marginBottom: '0.5rem', fontFamily: 'inherit' }}
        />

        <div style={{ marginBottom: '0.75rem' }}>
          <input
            value={slug}
            onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); onFieldChange() }}
            style={{ fontSize: '0.8125rem', padding: '0.25rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'inherit', width: '100%', maxWidth: 400 }}
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
            {typeof window !== 'undefined' ? window.location.origin : ''}{postUrlStyle === 'ROOT' ? '/' : '/gazette/'}{slug || '…'}
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <textarea
            value={excerpt}
            onChange={(e) => { setExcerpt(e.target.value); onFieldChange() }}
            maxLength={500}
            rows={2}
            placeholder="Shown in feeds and social previews"
            style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.875rem', fontFamily: 'inherit', background: 'var(--color-bg)', color: 'var(--color-text)', resize: 'vertical' }}
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', textAlign: 'right' }}>{excerpt.length}/500</div>
        </div>

        <div style={{ flex: 1, minHeight: 400, border: '1px solid var(--color-border)', borderRadius: 6, overflow: 'hidden' }}>
          <Puck
            config={bodyEditorConfig as any}
            overrides={PUCK_OVERRIDES}
            data={builderData as unknown as Data}
            onChange={handleBuilderChange}
            iframe={{ enabled: false }}
          />
        </div>
      </div>

      <div style={{ width: 320, flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="card" style={{ padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem' }}>Publish</h3>
          <div style={{ marginBottom: '0.5rem' }}>
            <span className={`badge ${status === 'PUBLISHED' ? 'badge-success' : status === 'SCHEDULED' ? 'badge-info' : 'badge-muted'}`}>
              {status === 'PUBLISHED' ? 'Published' : status === 'SCHEDULED' ? 'Scheduled' : 'Draft'}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            {saving ? 'Saving…' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Not saved yet'}
            <div>Ctrl+S / Cmd+S saves</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => doAutosave(currentFields())} disabled={saving}>Save Draft</button>
            {canPublish && (
              <>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => publishAction('publish')} disabled={publishBusy}>Publish Now</button>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <input
                    type="datetime-local"
                    value={scheduleInput}
                    onChange={(e) => setScheduleInput(e.target.value)}
                    style={{ flex: 1, padding: '0.25rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.75rem', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                  />
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => publishAction('schedule')} disabled={publishBusy || !scheduleInput}>Schedule</button>
                </div>
                {status !== 'DRAFT' && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => publishAction('unpublish')} disabled={publishBusy}>Unpublish</button>
                )}
              </>
            )}
            <button type="button" className="btn btn-ghost btn-sm" onClick={copyPreviewLink}>Copy preview link</button>
            {publishError && <div className="alert alert-danger" role="alert" style={{ fontSize: '0.75rem', margin: 0 }}>{publishError}</div>}
            {previewUrl && <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', wordBreak: 'break-all' }}>{previewUrl}</div>}
            {canSaveTemplate && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={saveAsTemplate}>{templateSaved ? 'Saved as template' : 'Save as Template'}</button>
            )}
          </div>
        </div>

        {panels}

        <div className="card" style={{ padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem' }}>Visibility</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
            <input type="checkbox" checked={isPrivate} onChange={(e) => { setIsPrivate(e.target.checked); onFieldChange() }} />
            Private
          </label>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>Hidden from the public site and feeds</div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
            <input type="checkbox" checked={isPinned} onChange={(e) => { setIsPinned(e.target.checked); onFieldChange() }} />
            Pinned
          </label>
        </div>

        {canReassignAuthor && (
          <div className="card" style={{ padding: '1rem' }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem' }}>Author</h3>
            <select
              value={authorId}
              onChange={(e) => { setAuthorId(e.target.value); onFieldChange() }}
              style={{ width: '100%', padding: '0.375rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.8125rem', background: 'var(--color-bg)', color: 'var(--color-text)' }}
            >
              {!authors.some((a) => a.userId === authorId) && <option value={authorId}>{authorId}</option>}
              {authors.map((a) => (
                <option key={a.userId} value={a.userId}>{a.displayName ?? a.username}</option>
              ))}
            </select>
          </div>
        )}

        <div className="card" style={{ padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem' }}>Featured image</h3>
          <OgImagePickerField
            name="featuredImageId"
            id="featuredImageId"
            value={featuredImageId}
            onChange={(v) => { setFeaturedImageId(v); scheduleAutosave({ ...currentFields(), featuredImageId: v || null }) }}
            field={{ label: '' } as CustomField<string>}
          />
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem' }}>Series</h3>
          <select
            value={seriesId}
            onChange={(e) => { setSeriesId(e.target.value); onFieldChange() }}
            style={{ width: '100%', padding: '0.375rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.8125rem', background: 'var(--color-bg)', color: 'var(--color-text)' }}
          >
            <option value="">None</option>
            {series.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
          {seriesId && (
            <div style={{ marginTop: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Position in series</label>
              <input
                type="number"
                value={seriesOrder}
                onChange={(e) => { setSeriesOrder(e.target.value === '' ? '' : Number(e.target.value)); onFieldChange() }}
                style={{ width: '100%', padding: '0.375rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.8125rem', background: 'var(--color-bg)', color: 'var(--color-text)' }}
              />
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem' }}>Tags</h3>
          <TagMultiSelect
            allTags={allTags}
            selectedIds={tagIds}
            onChange={(ids, nextTags) => { setTagIds(ids); setAllTags(nextTags); scheduleAutosave({ ...currentFields(), tagIds: ids }) }}
          />
        </div>

        <details className="card" style={{ padding: '1rem' }}>
          <summary style={{ fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer' }}>SEO</summary>
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Meta title</label>
              <input
                value={seoTitle}
                onChange={(e) => { setSeoTitle(e.target.value); onFieldChange() }}
                placeholder={title}
                maxLength={60}
                style={{ width: '100%', padding: '0.375rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.8125rem', background: 'var(--color-bg)', color: 'var(--color-text)' }}
              />
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', textAlign: 'right' }}>{seoTitle.length}/60</div>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Meta description</label>
              <textarea
                value={seoDescription}
                onChange={(e) => { setSeoDescription(e.target.value); onFieldChange() }}
                placeholder={excerpt}
                maxLength={160}
                rows={3}
                style={{ width: '100%', padding: '0.375rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.8125rem', background: 'var(--color-bg)', color: 'var(--color-text)', resize: 'vertical' }}
              />
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', textAlign: 'right' }}>{seoDescription.length}/160</div>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Canonical URL</label>
              <input
                value={canonicalUrl}
                onChange={(e) => { setCanonicalUrl(e.target.value); onFieldChange() }}
                style={{ width: '100%', padding: '0.375rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.8125rem', background: 'var(--color-bg)', color: 'var(--color-text)' }}
              />
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>Use this if the post was originally published elsewhere</div>
            </div>
          </div>
        </details>
      </div>
    </div>
  )
}
