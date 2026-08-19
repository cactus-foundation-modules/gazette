import { connection } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getVisiblePosts } from '@/modules/gazette/lib/db'
import { getPostUrlStyle, postHref } from '@/modules/gazette/lib/post-url'
import { gazetteFeedPuckComponent, type GazetteFeedBlockProps } from './GazetteFeedBlock'

export async function GazetteFeedBlockRsc(props: GazetteFeedBlockProps) {
  await connection()

  const count = props.count ?? 3
  const { posts } = await getVisiblePosts({ page: 1, perPage: count, tagSlug: props.tagSlug || undefined })

  const imageIds = posts.map((p) => p.featuredImageId).filter((id): id is string => !!id)
  const authorIds = posts.map((p) => p.authorId).filter((id): id is string => !!id)
  const [media, authors, style] = await Promise.all([
    imageIds.length ? prisma.media.findMany({ where: { id: { in: imageIds } }, select: { id: true, url: true } }) : Promise.resolve([]),
    authorIds.length ? prisma.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, displayName: true, username: true } }) : Promise.resolve([]),
    getPostUrlStyle(),
  ])
  const imageUrlById = Object.fromEntries(media.map((m) => [m.id, m.url]))
  const authorNameById = Object.fromEntries(authors.map((a) => [a.id, a.displayName ?? a.username]))

  const layout = props.layout ?? 'Grid'
  const gridCols = layout === 'List' ? 1 : layout === 'Compact' ? 4 : 3

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gridCols}, 1fr)`, gap: '1rem' }}>
      {posts.map((p) => (
        <a key={p.id} href={postHref(p.slug, style)} style={{ textDecoration: 'none', color: 'inherit', border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden', display: 'block' }}>
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
export const gazetteFeedPuckRscComponent = {
  ...gazetteFeedPuckComponent,
  render: GazetteFeedBlockRsc,
}
