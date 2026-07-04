import { connection } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getVisiblePostBySlug, getTagsForPost, getApprovedCommentCountsForPosts } from '@/modules/gazette/lib/db'
import { getGazetteSettings } from '@/modules/gazette/lib/settings'
import { readingTimeMinutes } from '@/modules/gazette/lib/reading-time'
import ViewTracker from '@/modules/gazette/components/public/ViewTracker'
import GazetteStyles from '@/modules/gazette/components/public/GazetteStyles'

// [ANCHOR] - entrySlug is injected by the post page (lib/inject-entry-context.ts)
export type GazetteEntryHeaderProps = { entrySlug?: string }

export function GazetteEntryHeader() {
  return (
    <div style={{ opacity: 0.6 }}>
      <div style={{ height: 200, background: 'var(--color-border)', borderRadius: 8, marginBottom: '1rem' }} />
      <div style={{ height: 32, width: '60%', background: 'var(--color-border)', borderRadius: 4 }} />
    </div>
  )
}

export async function GazetteEntryHeaderRsc(props: GazetteEntryHeaderProps) {
  await connection()
  if (!props.entrySlug) return null
  const post = await getVisiblePostBySlug(props.entrySlug)
  if (!post) return null

  const [settings, image, author, tags, commentCounts] = await Promise.all([
    getGazetteSettings(),
    post.featuredImageId ? prisma.media.findUnique({ where: { id: post.featuredImageId }, select: { url: true } }) : Promise.resolve(null),
    post.authorId ? prisma.user.findUnique({ where: { id: post.authorId }, select: { displayName: true, username: true } }) : Promise.resolve(null),
    getTagsForPost(post.id),
    getApprovedCommentCountsForPosts([post.id]),
  ])

  const effectiveDate = post.publishedAt ?? post.scheduledFor
  const readingTime = readingTimeMinutes(post.builderData)
  const authorName = author ? (author.displayName ?? author.username) : post.importedAuthorName
  const commentCount = commentCounts[post.id] ?? 0

  return (
    <div>
      <GazetteStyles />
      {image?.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image.url} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: '1.5rem' }} />
      )}
      <h1>{post.title}</h1>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        {authorName && <span>{authorName}</span>}
        {effectiveDate && <span>{new Date(effectiveDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
        <span>{readingTime} min read</span>
        {commentCount > 0 && <span>{commentCount} comments</span>}
      </div>
      {settings.showViewCounts && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{post.viewCount} views</p>}
      {tags.length > 0 && (
        <div style={{ marginBottom: '1.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          Tagged: {tags.map((t) => t.name).join(', ')}
        </div>
      )}
      <ViewTracker postId={post.id} />
    </div>
  )
}

export const gazetteEntryHeaderPuckComponent = {
  label: 'Gazette: Entry Header [Anchor]',
  fields: {},
  defaultProps: {},
  permissions: { delete: false, duplicate: false },
  render: GazetteEntryHeader,
}

export const gazetteEntryHeaderPuckRscComponent = { ...gazetteEntryHeaderPuckComponent, render: GazetteEntryHeaderRsc }
