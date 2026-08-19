'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Puck } from '@puckeditor/core'
import type { Data, CustomField } from '@puckeditor/core'
import '@puckeditor/core/no-external.css'
import { bodyEditorConfig } from '@/modules/gazette/components/puck/body/bodyEditorConfig'
import { OgImagePickerField } from '@/lib/puck/MediaPickerField'
import TagMultiSelect from './TagMultiSelect'
import type { GazettePost, GazetteTag, GazetteSeries, PostUrlStyle, PuckData } from '@/modules/gazette/lib/types'
import type { AuthorListItem } from '@/modules/gazette/lib/db'

type Props = {
  post: GazettePost & { tagIds: string[] }
  tags: GazetteTag[]
  series: GazetteSeries[]
  authors: AuthorListItem[]
  currentUserId: string
  canPublish: boolean
  canReassignAuthor: boolean
  postUrlStyle: PostUrlStyle
}

const AUTOSAVE_DEBOUNCE_MS = 1500

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 100)
}

export default function PostEditor({ post, tags, series, authors, currentUserId, canPublish, canReassignAuthor, postUrlStyle }: Props) {
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

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  async function publishAction(action: 'publish' | 'schedule' | 'unpublish') {
    setPublishBusy(true)
    const body: Record<string, unknown> = { action }
    if (action === 'schedule') {
      if (!scheduleInput) { setPublishBusy(false); return }
      body.scheduledFor = new Date(scheduleInput).toISOString()
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
    await fetch('/api/m/gazette/admin/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, builderData }),
    })
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
            {previewUrl && <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)', wordBreak: 'break-all' }}>{previewUrl}</div>}
            <button type="button" className="btn btn-ghost btn-sm" onClick={saveAsTemplate}>{templateSaved ? 'Saved as template' : 'Save as Template'}</button>
          </div>
        </div>

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
