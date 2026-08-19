import { notFound } from 'next/navigation'
import { Render } from '@puckeditor/core/rsc'
import { prisma } from '@/lib/db/prisma'
import { getSessionFromCookie } from '@/lib/auth/session'
import { getVisiblePostBySlug, getApprovedCommentCountsForPosts, getTagsForPost, getReactionCounts } from '@/modules/gazette/lib/db'
import { getGazetteSettings } from '@/modules/gazette/lib/settings'
import { postUrl } from '@/modules/gazette/lib/post-url'
import { siteUrl } from '@/modules/gazette/lib/site-url'
import { extractHeadings } from '@/modules/gazette/lib/toc'
import { getGazetteBreakpoints } from '@/modules/gazette/lib/breakpoints'
import { readingTimeMinutes } from '@/modules/gazette/lib/reading-time'
import GazetteStyles from './GazetteStyles'
import PostBody from './PostBody'
import TableOfContents from './TableOfContents'
import ShareButtons from './ShareButtons'
import Reactions from './Reactions'
import ViewTracker from './ViewTracker'
import CommentsSection from './CommentsSection'
import AuthorBio from './AuthorBio'
import SeriesNav from './SeriesNav'
import RelatedPosts from './RelatedPosts'
import { resolveThemeLayout } from '@/lib/layout/resolveThemeLayout'
import { getModuleLayoutPuckRscConfig } from '@/lib/puck/config.rsc'
import { injectEntryContext } from '@/modules/gazette/lib/inject-entry-context'
import type { PuckData } from '@/modules/gazette/lib/types'

// The post itself, shared by both addresses it can be served at: /gazette/<slug>
// on the default URL style, and /<slug> when the site has moved posts to the
// root. One renderer, so the two can never drift apart.
export default async function PostPageView({ slug }: { slug: string }) {
  const post = await getVisiblePostBySlug(slug)
  if (!post) notFound()

  const layout = await resolveThemeLayout('gazetteEntry', { moduleName: 'gazette', slug: post.slug })
  if (layout?.builderData) {
    const data = injectEntryContext(layout.builderData as PuckData, { entrySlug: post.slug })
    return <Render config={getModuleLayoutPuckRscConfig('gazetteEntry') as any} data={data as any} />
  }

  const [settings, user, image, author, tags, commentCounts, reactionCounts] = await Promise.all([
    getGazetteSettings(),
    getSessionFromCookie(),
    post.featuredImageId ? prisma.media.findUnique({ where: { id: post.featuredImageId }, select: { url: true } }) : Promise.resolve(null),
    post.authorId ? prisma.user.findUnique({ where: { id: post.authorId }, select: { displayName: true, username: true } }) : Promise.resolve(null),
    getTagsForPost(post.id),
    getApprovedCommentCountsForPosts([post.id]),
    getReactionCounts(post.id),
  ])

  const effectiveDate = post.publishedAt ?? post.scheduledFor
  const headings = extractHeadings(post.builderData)
  const { tabletBp } = await getGazetteBreakpoints()
  const readingTime = readingTimeMinutes(post.builderData)
  const authorName = author ? (author.displayName ?? author.username) : post.importedAuthorName
  const commentCount = commentCounts[post.id] ?? 0

  return (
    <div className="gz-container">
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

      <TableOfContents headings={headings} desktopBreakpoint={tabletBp} />
      <PostBody builderData={post.builderData} />

      {settings.showViewCounts && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{post.viewCount} views</p>}

      {settings.reactionsEnabled && (
        <Reactions postId={post.id} reactionSet={settings.reactionSet ?? []} initialCounts={reactionCounts} />
      )}

      <ShareButtons url={postUrl(siteUrl(), post.slug, settings.postUrlStyle)} title={post.title} />

      {post.seriesId && <SeriesNav seriesId={post.seriesId} currentPostId={post.id} />}

      <AuthorBio authorId={post.authorId} importedAuthorName={post.importedAuthorName} />

      <RelatedPosts postId={post.id} showViewCounts={settings.showViewCounts} />

      <CommentsSection postId={post.id} settings={settings} loggedIn={!!user} />

      <ViewTracker postId={post.id} />

      {tags.length > 0 && (
        <div style={{ marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          Tagged: {tags.map((t) => t.name).join(', ')}
        </div>
      )}
    </div>
  )
}
