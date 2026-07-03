import { prisma } from '@/lib/db/prisma'
import PostCard from './PostCard'
import { getApprovedCommentCountsForPosts } from '@/modules/gazette/lib/db'
import type { GazettePostListItem } from '@/modules/gazette/lib/types'

export default async function PostGrid({ posts, showViewCounts }: { posts: GazettePostListItem[]; showViewCounts: boolean }) {
  if (posts.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)' }}>Nothing published yet - check back soon.</p>
  }

  const imageIds = posts.map((p) => p.featuredImageId).filter((id): id is string => !!id)
  const authorIds = posts.map((p) => p.authorId).filter((id): id is string => !!id)

  const [media, authors, commentCounts] = await Promise.all([
    imageIds.length ? prisma.media.findMany({ where: { id: { in: imageIds } }, select: { id: true, url: true } }) : Promise.resolve([]),
    authorIds.length ? prisma.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, displayName: true, username: true } }) : Promise.resolve([]),
    getApprovedCommentCountsForPosts(posts.map((p) => p.id)),
  ])
  const imageUrlById = Object.fromEntries(media.map((m) => [m.id, m.url]))
  const authorNameById = Object.fromEntries(authors.map((a) => [a.id, a.displayName ?? a.username]))

  return (
    <div className="gz-post-grid">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          imageUrl={post.featuredImageId ? imageUrlById[post.featuredImageId] : null}
          authorName={post.authorId ? authorNameById[post.authorId] : post.importedAuthorName}
          commentCount={commentCounts[post.id] ?? 0}
          showViewCounts={showViewCounts}
        />
      ))}
    </div>
  )
}
