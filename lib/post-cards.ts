import { prisma } from '@/lib/db/prisma'
import { findRenditionUrls } from '@/lib/media/rendition-lookup'
import { THUMB_RENDITION_SUFFIX } from '@/lib/media/thumb-renditions'
import { getApprovedCommentCountsForPosts } from './db'
import { getPostUrlStyle, postHref } from './post-url'
import type { GazettePostCard, GazettePostListItem, PostUrlStyle } from './types'

const DATE_FORMAT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }

// Turns post rows into the flat, JSON-safe shape a card draws from - one place
// for the image/author/comment-count lookups, whether the cards are going
// straight into a server render or out through the public posts endpoint for
// the load-more list.
//
// The href is baked in here rather than in the card component, because the card
// is also rendered in the browser by the load-more list, which has no way to ask
// the database which URL style the site is on. Callers already holding the
// settings row can pass the style straight in and save the extra read.
export async function toPostCards(posts: GazettePostListItem[], style?: PostUrlStyle): Promise<GazettePostCard[]> {
  if (posts.length === 0) return []

  const urlStyle = style ?? (await getPostUrlStyle())

  const imageIds = posts.map((p) => p.featuredImageId).filter((id): id is string => !!id)
  const authorIds = posts.map((p) => p.authorId).filter((id): id is string => !!id)

  const [media, authors, commentCounts] = await Promise.all([
    imageIds.length ? prisma.media.findMany({ where: { id: { in: imageIds } }, select: { id: true, url: true } }) : Promise.resolve([]),
    authorIds.length ? prisma.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, displayName: true, username: true } }) : Promise.resolve([]),
    getApprovedCommentCountsForPosts(posts.map((p) => p.id)),
  ])
  // The 300px copy of each cover where the library has one, because a card draws it
  // at card size. Posts on this platform routinely reuse a product photograph as
  // their cover, and a product photograph is a studio shot: three cards on one
  // homepage were pulling 591 KB between them to fill three thumbnails.
  //
  // One extra batched query for the whole set - never one per card - and the
  // lookup is deliberately imported from the sharp-free half of the media library,
  // so asking the question costs a query rather than an image library in the bundle.
  //
  // `imageUrl` is read in exactly one place, the card's own <img> (PostCard.tsx),
  // so swapping it here is the whole job: the feed block, the listings, the
  // related-posts strip and the load-more endpoint all draw from this. The post
  // page's own header reads its picture separately and still gets the full one.
  const covers = media.map((m) => m.url)
  const small = covers.length
    ? await findRenditionUrls(covers, THUMB_RENDITION_SUFFIX).catch(() => new Map<string, string>())
    : new Map<string, string>()
  const imageUrlById = Object.fromEntries(media.map((m) => [m.id, small.get(m.url) ?? m.url]))
  const authorNameById = Object.fromEntries(authors.map((a) => [a.id, a.displayName ?? a.username]))

  return posts.map((post) => {
    const date = post.publishedAt ?? post.scheduledFor
    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      href: postHref(post.slug, urlStyle),
      excerpt: post.excerpt,
      date: date ? new Date(date).toISOString() : null,
      dateLabel: date ? new Date(date).toLocaleDateString('en-GB', DATE_FORMAT) : null,
      imageUrl: post.featuredImageId ? imageUrlById[post.featuredImageId] ?? null : null,
      authorName: post.authorId ? authorNameById[post.authorId] ?? null : post.importedAuthorName,
      commentCount: commentCounts[post.id] ?? 0,
      viewCount: post.viewCount,
    }
  })
}
