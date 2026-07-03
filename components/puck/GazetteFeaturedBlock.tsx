import { connection } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getVisiblePosts } from '@/modules/gazette/lib/db'

export type GazetteFeaturedBlockProps = { source?: string; layout?: string }

export function GazetteFeaturedBlock({ layout }: GazetteFeaturedBlockProps) {
  const tall = layout !== 'Minimal'
  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden', opacity: 0.6 }}>
      {tall && <div style={{ height: 220, background: 'var(--color-border)' }} />}
      <div style={{ padding: '1rem' }}>
        <div style={{ height: 20, width: '60%', background: 'var(--color-border)', borderRadius: 4 }} />
      </div>
    </div>
  )
}

// RSC: calls connection() so pages embedding this block render dynamically -
// otherwise a pinned/latest post promotion wouldn't surface on a cached page.
export async function GazetteFeaturedBlockRsc({ source, layout }: GazetteFeaturedBlockProps) {
  await connection()

  const { posts } = await getVisiblePosts({ page: 1, perPage: 10 })
  const chosen = source === 'Pinned' ? posts.find((p) => p.isPinned) ?? posts[0] : posts[0]
  if (!chosen) return null

  const image = chosen.featuredImageId
    ? await prisma.media.findUnique({ where: { id: chosen.featuredImageId }, select: { url: true } })
    : null

  const isHero = layout === 'Hero'
  const isMinimal = layout === 'Minimal'

  return (
    <a href={`/gazette/${chosen.slug}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block', border: isMinimal ? 'none' : '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
      {!isMinimal && image?.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image.url} alt="" style={{ width: '100%', aspectRatio: isHero ? '21/9' : '16/9', objectFit: 'cover', display: 'block' }} />
      )}
      <div style={{ padding: isMinimal ? 0 : '1.25rem' }}>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: isHero ? '2rem' : '1.25rem' }}>{chosen.title}</h2>
        {chosen.excerpt && <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>{chosen.excerpt}</p>}
      </div>
    </a>
  )
}

export const gazetteFeaturedPuckComponent = {
  label: 'Gazette Featured',
  fields: {
    source: { type: 'select' as const, label: 'Source', options: [{ value: 'Latest', label: 'Latest post' }, { value: 'Pinned', label: 'Pinned post' }] },
    layout: { type: 'select' as const, label: 'Layout', options: [{ value: 'Hero', label: 'Hero' }, { value: 'Card', label: 'Card' }, { value: 'Minimal', label: 'Minimal' }] },
  },
  defaultProps: { source: 'Latest', layout: 'Card' },
  render: GazetteFeaturedBlock,
}

export const gazetteFeaturedPuckRscComponent = {
  ...gazetteFeaturedPuckComponent,
  render: GazetteFeaturedBlockRsc,
}
