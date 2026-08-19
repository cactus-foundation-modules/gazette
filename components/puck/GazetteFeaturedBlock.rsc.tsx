import { connection } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getVisiblePosts } from '@/modules/gazette/lib/db'
import { getPostUrlStyle, postHref } from '@/modules/gazette/lib/post-url'
import { gazetteFeaturedPuckComponent, type GazetteFeaturedBlockProps } from './GazetteFeaturedBlock'

export async function GazetteFeaturedBlockRsc({ source, layout }: GazetteFeaturedBlockProps) {
  await connection()

  const { posts } = await getVisiblePosts({ page: 1, perPage: 10 })
  const chosen = source === 'Pinned' ? posts.find((p) => p.isPinned) ?? posts[0] : posts[0]
  if (!chosen) return null

  const [image, style] = await Promise.all([
    chosen.featuredImageId
      ? prisma.media.findUnique({ where: { id: chosen.featuredImageId }, select: { url: true } })
      : Promise.resolve(null),
    getPostUrlStyle(),
  ])

  const isHero = layout === 'Hero'
  const isMinimal = layout === 'Minimal'

  return (
    <a href={postHref(chosen.slug, style)} style={{ textDecoration: 'none', color: 'inherit', display: 'block', border: isMinimal ? 'none' : '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
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
export const gazetteFeaturedPuckRscComponent = {
  ...gazetteFeaturedPuckComponent,
  render: GazetteFeaturedBlockRsc,
}
