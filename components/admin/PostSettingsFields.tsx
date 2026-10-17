'use client'

import type { CSSProperties, ReactElement, ReactNode } from 'react'
import type { CustomField } from '@puckeditor/core'
import { OgImagePickerField } from '@/lib/puck/MediaPickerField'
import TagMultiSelect from './TagMultiSelect'
import { usePostEditor } from './postEditorContext'

// The post's settings, as the root fields of the Puck editor: with nothing
// selected on the canvas they are what the right-hand "Page" pane shows. Each is
// a custom field that ignores Puck's own value and reads the live post through
// the editor's context, because none of this belongs in the post's body data.

const inputStyle: CSSProperties = {
  width: '100%', padding: '0.375rem 0.5rem', border: '1px solid var(--color-border)',
  borderRadius: 6, fontSize: '0.8125rem', fontFamily: 'inherit',
  background: 'var(--color-bg)', color: 'var(--color-text)', boxSizing: 'border-box',
}
const labelStyle: CSSProperties = { display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '0.25rem' }
const hintStyle: CSSProperties = { fontSize: '0.6875rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingBottom: '0.5rem' }}>
      <div style={{ fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.6875rem' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Counter({ value, max }: { value: string; max: number }) {
  return <div style={{ ...hintStyle, textAlign: 'right', marginTop: 0 }}>{value.length}/{max}</div>
}

/** What a typed slug is allowed to be: the API only takes lower-case letters, digits and hyphens. */
function cleanSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 100)
}

function slugFromTitle(title: string): string {
  return cleanSlug(title.trim().replace(/\s+/g, '-')).replace(/^-+|-+$/g, '')
}

function DetailsField() {
  const { fields, update, postUrlStyle, siteBase } = usePostEditor()
  return (
    <Section title="Post">
      <div>
        <label style={labelStyle} htmlFor="gz-post-title">Title</label>
        <input
          id="gz-post-title"
          value={fields.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Post title"
          maxLength={200}
          style={{ ...inputStyle, fontSize: '0.9375rem', fontWeight: 600 }}
        />
      </div>
      <div>
        <label style={labelStyle} htmlFor="gz-post-slug">Slug</label>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <input
            id="gz-post-slug"
            value={fields.slug}
            onChange={(e) => update({ slug: cleanSlug(e.target.value) })}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => update({ slug: slugFromTitle(fields.title) })}
            disabled={!fields.title.trim()}
            title="Make the slug from the title"
          >
            From title
          </button>
        </div>
        <div style={{ ...hintStyle, wordBreak: 'break-all' }}>
          {siteBase}{postUrlStyle === 'ROOT' ? '/' : '/gazette/'}{fields.slug || '…'}
        </div>
      </div>
      <div>
        <label style={labelStyle} htmlFor="gz-post-excerpt">Short description</label>
        <textarea
          id="gz-post-excerpt"
          value={fields.excerpt}
          onChange={(e) => update({ excerpt: e.target.value })}
          maxLength={500}
          rows={3}
          placeholder="Shown in feeds and social previews"
          style={{ ...inputStyle, resize: 'vertical' }}
        />
        <Counter value={fields.excerpt} max={500} />
      </div>
    </Section>
  )
}

function PublishField() {
  const {
    status, saving, lastSaved, saveError, canPublish, canSaveTemplate, publishBusy, publishError,
    scheduleInput, setScheduleInput, previewUrl, templateSaved,
    saveNow, publishAction, copyPreviewLink, saveAsTemplate,
  } = usePostEditor()
  return (
    <Section title="Publish">
      <div>
        <span className={`badge ${status === 'PUBLISHED' ? 'badge-success' : status === 'SCHEDULED' ? 'badge-info' : 'badge-muted'}`}>
          {status === 'PUBLISHED' ? 'Published' : status === 'SCHEDULED' ? 'Scheduled' : 'Draft'}
        </span>
        <div style={{ ...hintStyle, marginTop: '0.5rem' }}>
          {saving ? 'Saving…' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Not saved yet'}
          <div>Changes save by themselves. Ctrl+S / Cmd+S saves now.</div>
        </div>
      </div>
      {saveError && <div className="alert alert-danger" role="alert" style={{ fontSize: '0.75rem', margin: 0 }}>{saveError}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button type="button" className="btn btn-secondary btn-sm" onClick={saveNow} disabled={saving}>Save Draft</button>
        {canPublish && (
          <>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => publishAction('publish')} disabled={publishBusy}>
              {status === 'PUBLISHED' ? 'Publish again' : 'Publish Now'}
            </button>
            <div>
              <label style={labelStyle} htmlFor="gz-post-schedule">Schedule for</label>
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                <input
                  id="gz-post-schedule"
                  type="datetime-local"
                  value={scheduleInput}
                  onChange={(e) => setScheduleInput(e.target.value)}
                  style={{ ...inputStyle, flex: 1, minWidth: 0 }}
                />
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => publishAction('schedule')} disabled={publishBusy || !scheduleInput}>Schedule</button>
              </div>
            </div>
            {status !== 'DRAFT' && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => publishAction('unpublish')} disabled={publishBusy}>Unpublish</button>
            )}
          </>
        )}
        <button type="button" className="btn btn-ghost btn-sm" onClick={copyPreviewLink}>Copy preview link</button>
        {publishError && <div className="alert alert-danger" role="alert" style={{ fontSize: '0.75rem', margin: 0 }}>{publishError}</div>}
        {previewUrl && <div style={{ ...hintStyle, wordBreak: 'break-all' }}>{previewUrl}</div>}
        {canSaveTemplate && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={saveAsTemplate}>{templateSaved ? 'Saved as template' : 'Save as Template'}</button>
        )}
      </div>
    </Section>
  )
}

function SocialField() {
  const { panels } = usePostEditor()
  return (
    <Section title="Social media">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>{panels}</div>
    </Section>
  )
}

function VisibilityField() {
  const { fields, update } = usePostEditor()
  return (
    <Section title="Visibility">
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
          <input type="checkbox" checked={fields.isPrivate} onChange={(e) => update({ isPrivate: e.target.checked })} />
          Private
        </label>
        <div style={hintStyle}>Hidden from the public site and feeds</div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
        <input type="checkbox" checked={fields.isPinned} onChange={(e) => update({ isPinned: e.target.checked })} />
        Pinned
      </label>
    </Section>
  )
}

function AuthorField() {
  const { fields, update, authors } = usePostEditor()
  return (
    <Section title="Author">
      <select value={fields.authorId} onChange={(e) => update({ authorId: e.target.value })} style={inputStyle} aria-label="Author">
        {!authors.some((a) => a.userId === fields.authorId) && <option value={fields.authorId}>{fields.authorId}</option>}
        {authors.map((a) => (
          <option key={a.userId} value={a.userId}>{a.displayName ?? a.username}</option>
        ))}
      </select>
    </Section>
  )
}

function FeaturedImageField() {
  const { fields, update } = usePostEditor()
  return (
    <Section title="Featured image">
      <OgImagePickerField
        name="featuredImageId"
        id="featuredImageId"
        value={fields.featuredImageId}
        onChange={(v) => update({ featuredImageId: v })}
        field={{ label: '' } as CustomField<string>}
      />
    </Section>
  )
}

function SeriesField() {
  const { fields, update, series } = usePostEditor()
  return (
    <Section title="Series">
      <select value={fields.seriesId} onChange={(e) => update({ seriesId: e.target.value })} style={inputStyle} aria-label="Series">
        <option value="">None</option>
        {series.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
      </select>
      {fields.seriesId && (
        <div>
          <label style={labelStyle} htmlFor="gz-post-series-order">Position in series</label>
          <input
            id="gz-post-series-order"
            type="number"
            value={fields.seriesOrder}
            onChange={(e) => update({ seriesOrder: e.target.value === '' ? '' : Math.trunc(Number(e.target.value)) })}
            style={inputStyle}
          />
        </div>
      )}
    </Section>
  )
}

function TagsField() {
  const { fields, update, tags } = usePostEditor()
  return (
    <Section title="Tags">
      <TagMultiSelect allTags={tags} selectedIds={fields.tagIds} onChange={(ids) => update({ tagIds: ids })} />
    </Section>
  )
}

function SeoField() {
  const { fields, update } = usePostEditor()
  return (
    <Section title="SEO">
      <div>
        <label style={labelStyle} htmlFor="gz-post-seo-title">Meta title</label>
        <input
          id="gz-post-seo-title"
          value={fields.seoTitle}
          onChange={(e) => update({ seoTitle: e.target.value })}
          placeholder={fields.title}
          maxLength={60}
          style={inputStyle}
        />
        <Counter value={fields.seoTitle} max={60} />
      </div>
      <div>
        <label style={labelStyle} htmlFor="gz-post-seo-description">Meta description</label>
        <textarea
          id="gz-post-seo-description"
          value={fields.seoDescription}
          onChange={(e) => update({ seoDescription: e.target.value })}
          placeholder={fields.excerpt}
          maxLength={160}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
        <Counter value={fields.seoDescription} max={160} />
      </div>
      <div>
        <label style={labelStyle} htmlFor="gz-post-canonical">Canonical URL</label>
        <input
          id="gz-post-canonical"
          value={fields.canonicalUrl}
          onChange={(e) => update({ canonicalUrl: e.target.value })}
          style={inputStyle}
        />
        <div style={hintStyle}>Use this if the post was originally published elsewhere</div>
      </div>
    </Section>
  )
}

function custom(render: () => ReactElement): CustomField<unknown> {
  return { type: 'custom', label: '', render }
}

/**
 * The Page pane's fields, in the order they appear. The author and social
 * sections are left out when there is nothing to show in them, so an empty
 * heading never sits there.
 */
export function buildPostRootFields({ hasPanels, canReassignAuthor }: { hasPanels: boolean; canReassignAuthor: boolean }) {
  const fields: Record<string, CustomField<unknown>> = {
    postDetails: custom(DetailsField),
    postPublish: custom(PublishField),
    ...(hasPanels ? { postSocial: custom(SocialField) } : {}),
    postVisibility: custom(VisibilityField),
    ...(canReassignAuthor ? { postAuthor: custom(AuthorField) } : {}),
    postImage: custom(FeaturedImageField),
    postSeries: custom(SeriesField),
    postTags: custom(TagsField),
    postSeo: custom(SeoField),
  }
  // The tab strip sorts fields into Block / Appearance / Layout by name, and a
  // name like "visibility" would be sent to Layout. These are all one list.
  const fieldTabs = Object.fromEntries(Object.keys(fields).map((name) => [name, 'block' as const]))
  return { fields, fieldTabs }
}
