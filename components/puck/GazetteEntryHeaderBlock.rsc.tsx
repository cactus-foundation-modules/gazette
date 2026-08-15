import { connection } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getVisiblePostBySlug, getTagsForPost, getApprovedCommentCountsForPosts } from '@/modules/gazette/lib/db'
import { getGazetteSettings } from '@/modules/gazette/lib/settings'
import { readingTimeMinutes } from '@/modules/gazette/lib/reading-time'
import ViewTracker from '@/modules/gazette/components/public/ViewTracker'
import GazetteStyles from '@/modules/gazette/components/public/GazetteStyles'
import {
  gazetteEntryHeaderPuckComponent,
  showsPart,
  entryHeaderImageStyle,
  type GazetteEntryHeaderProps,
} from './GazetteEntryHeaderBlock'

const DATE_FORMATS: Record<string, Intl.DateTimeFormatOptions> = {
  long: { day: 'numeric', month: 'long', year: 'numeric' },
  short: { day: 'numeric', month: 'short', year: 'numeric' },
  numeric: { day: '2-digit', month: '2-digit', year: 'numeric' },
}

export async function GazetteEntryHeaderRsc(props: GazetteEntryHeaderProps) {
  await connection()
  if (!props.entrySlug) return null
  const post = await getVisiblePostBySlug(props.entrySlug)
  if (!post) return null

  const wantsImage = showsPart(props.showImage)
  const wantsTags = showsPart(props.showTags)
  const wantsComments = showsPart(props.showComments)

  const [settings, image, author, tags, commentCounts] = await Promise.all([
    getGazetteSettings(),
    wantsImage && post.featuredImageId ? prisma.media.findUnique({ where: { id: post.featuredImageId }, select: { url: true } }) : Promise.resolve(null),
    post.authorId ? prisma.user.findUnique({ where: { id: post.authorId }, select: { displayName: true, username: true } }) : Promise.resolve(null),
    wantsTags ? getTagsForPost(post.id) : Promise.resolve([]),
    wantsComments ? getApprovedCommentCountsForPosts([post.id]) : Promise.resolve({} as Record<string, number>),
  ])

  const effectiveDate = post.publishedAt ?? post.scheduledFor
  const readingTime = readingTimeMinutes(post.builderData)
  const authorName = author ? (author.displayName ?? author.username) : post.importedAuthorName
  const commentCount = commentCounts[post.id] ?? 0
  const centred = props.align === 'center'
  // The site-wide "show view counts" setting still has the last word: a block
  // option can turn the count off, never on.
  const showViews = settings.showViewCounts && showsPart(props.showViews)
  const tagsLabel = (props.tagsLabel ?? 'Tagged:').trim()

  return (
    <div style={centred ? { textAlign: 'center' } : undefined}>
      <GazetteStyles />
      {image?.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image.url} alt="" style={entryHeaderImageStyle(props)} />
      )}
      <h1>{post.title}</h1>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: centred ? 'center' : undefined, color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        {authorName && showsPart(props.showAuthor) && <span>{authorName}</span>}
        {effectiveDate && showsPart(props.showDate) && (
          <span>{new Date(effectiveDate).toLocaleDateString('en-GB', DATE_FORMATS[props.dateFormat ?? 'long'] ?? DATE_FORMATS.long)}</span>
        )}
        {showsPart(props.showReadingTime) && <span>{readingTime} min read</span>}
        {wantsComments && commentCount > 0 && <span>{commentCount} comments</span>}
      </div>
      {showViews && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{post.viewCount} views</p>}
      {tags.length > 0 && (
        <div style={{ marginBottom: '1.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          {tagsLabel ? `${tagsLabel} ` : ''}{tags.map((t) => t.name).join(', ')}
        </div>
      )}
      <ViewTracker postId={post.id} />
    </div>
  )
}
export const gazetteEntryHeaderPuckRscComponent = { ...gazetteEntryHeaderPuckComponent, render: GazetteEntryHeaderRsc }
