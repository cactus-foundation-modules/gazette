import { connection } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getVisiblePosts } from '@/modules/gazette/lib/db'

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
export async function GazetteFeedBlockRsc(props: GazetteFeedBlockProps) {
  await connection()

  const count = props.count ?? 3
  const { posts } = await getVisiblePosts({ page: 1, perPage: count, tagSlug: props.tagSlug || undefined })

  const imageIds = posts.map((p) => p.featuredImageId).filter((id): id is string => !!id)
  const authorIds = posts.map((p) => p.authorId).filter((id): id is string => !!id)
  const [media, authors] = await Promise.all([
    imageIds.length ? prisma.media.findMany({ where: { id: { in: imageIds } }, select: { id: true, url: true } }) : Promise.resolve([]),
    authorIds.length ? prisma.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, displayName: true, username: true } }) : Promise.resolve([]),
  ])
  const imageUrlById = Object.fromEntries(media.map((m) => [m.id, m.url]))
  const authorNameById = Object.fromEntries(authors.map((a) => [a.id, a.displayName ?? a.username]))

  const layout = props.layout ?? 'Grid'
  const gridCols = layout === 'List' ? 1 : layout === 'Compact' ? 4 : 3

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gridCols}, 1fr)`, gap: '1rem' }}>
      {posts.map((p) => (
        <a key={p.id} href={`/gazette/${p.slug}`} style={{ textDecoration: 'none', color: 'inherit', border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden', display: 'block' }}>
          {props.showImage !== 'no' && p.featuredImageId && imageUrlById[p.featuredImageId] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrlById[p.featuredImageId]} alt="" style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
          )}
          <div style={{ padding: '0.875rem' }}>
            <h3 style={{ margin: '0 0 0.375rem', fontSize: '1.0625rem' }}>{p.title}</h3>
            {props.showExcerpt !== 'no' && p.excerpt && <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{p.excerpt}</p>}
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', gap: '0.5rem' }}>
              {props.showAuthor !== 'no' && p.authorId && <span>{authorNameById[p.authorId]}</span>}
              {props.showDate !== 'no' && (p.publishedAt ?? p.scheduledFor) && (
                <span>{new Date((p.publishedAt ?? p.scheduledFor)!).toLocaleDateString('en-GB')}</span>
              )}
            </div>
            <span style={{ display: 'inline-block', marginTop: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-primary)' }}>
              {props.readMoreLabel || 'Read more'}
            </span>
          </div>
        </a>
      ))}
    </div>
  )
}

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

export const gazetteFeedPuckRscComponent = {
  ...gazetteFeedPuckComponent,
  render: GazetteFeedBlockRsc,
}
