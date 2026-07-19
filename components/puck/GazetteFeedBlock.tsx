import { connection } from 'next/server'

// Editor half only. The database-backed render lives in ./GazetteFeedBlock.rsc.
//
// This file reaches the Puck editor's client bundle through the generated
// module-components registry, so whatever it imports ends up in the browser. It
// must never reach prisma: lib/db/prisma attaches a client extension at module
// scope, which throws on load in a browser and takes the whole page builder
// down, not just this block.

export type GazetteFeedBlockProps = {
  layout?: string
  count?: number
  tagSlug?: string
  showExcerpt?: string
  showAuthor?: string
  showDate?: string
  showImage?: string
  readMoreLabel?: string
}

// Editor canvas: static skeleton, no fetch during render (matches contact-form's
// pattern of a lightweight, non-fetching editor preview).
export function GazetteFeedBlock(props: GazetteFeedBlockProps) {
  const count = props.count ?? 3
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(count, 3)}, 1fr)`, gap: '1rem', opacity: 0.6 }}>
      {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
        <div key={i} style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: '1rem' }}>
          <div style={{ height: 100, background: 'var(--color-border)', borderRadius: 6, marginBottom: '0.5rem' }} />
          <div style={{ height: 14, width: '80%', background: 'var(--color-border)', borderRadius: 4 }} />
        </div>
      ))}
    </div>
  )
}

// RSC: queries real posts, calling connection() first so any page embedding this
// block renders per-request rather than being cached (Risk 6) - scheduled posts
// must be able to surface here without a redeploy.

export const gazetteFeedPuckComponent = {
  label: 'Gazette Feed',
  fields: {
    layout: { type: 'select' as const, label: 'Layout', options: [{ value: 'Grid', label: 'Grid' }, { value: 'List', label: 'List' }, { value: 'Compact', label: 'Compact' }] },
    count: { type: 'number' as const, label: 'Number of posts' },
    tagSlug: { type: 'text' as const, label: 'Tag slug (optional)' },
    showExcerpt: { type: 'select' as const, label: 'Show excerpt', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
    showAuthor: { type: 'select' as const, label: 'Show author', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
    showDate: { type: 'select' as const, label: 'Show date', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
    showImage: { type: 'select' as const, label: 'Show image', options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
    readMoreLabel: { type: 'text' as const, label: '"Read more" label' },
  },
  defaultProps: {
    layout: 'Grid', count: 3, tagSlug: '', showExcerpt: 'yes', showAuthor: 'yes', showDate: 'yes', showImage: 'yes', readMoreLabel: 'Read more',
  },
  async resolveFields(_data: GazetteFeedBlockProps, { fields }: { fields: Record<string, unknown> }) {
    try {
      const res = await fetch('/api/m/gazette/admin/tags')
      if (!res.ok) return fields
      const data = await res.json()
      const options = (data.tags ?? []).map((t: { name: string; slug: string }) => ({ value: t.slug, label: t.name }))
      if (options.length === 0) return fields
      return { ...fields, tagSlug: { type: 'select' as const, label: 'Tag', options: [{ value: '', label: 'All tags' }, ...options] } }
    } catch {
      return fields
    }
  },
  render: GazetteFeedBlock,
}
