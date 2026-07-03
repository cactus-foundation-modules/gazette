import Link from 'next/link'
import type { GazettePostListItem } from '@/modules/gazette/lib/types'

export default function PostCard({ post, imageUrl, authorName, commentCount, showViewCounts }: {
  post: GazettePostListItem
  imageUrl?: string | null
  authorName?: string | null
  commentCount?: number
  showViewCounts?: boolean
}) {
  const date = post.publishedAt ?? post.scheduledFor
  return (
    <Link href={`/gazette/${post.slug}`} className="gz-post-card">
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" />
      )}
      <div className="gz-post-card-body">
        <h3>{post.title}</h3>
        {post.excerpt && <p>{post.excerpt}</p>}
        <div className="gz-post-card-meta">
          {authorName && <span>{authorName}</span>}
          {date && <span>{new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
          {typeof commentCount === 'number' && commentCount > 0 && <span>{commentCount} comments</span>}
          {showViewCounts && <span>{post.viewCount} views</span>}
        </div>
      </div>
    </Link>
  )
}
