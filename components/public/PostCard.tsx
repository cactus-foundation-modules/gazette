import Link from 'next/link'
import type { GazettePostCard, PostCardDisplay } from '@/modules/gazette/lib/types'

// Presentational only - no data access - so the load-more list can render the
// same card client-side as the server did.
export default function PostCard({ card, display }: { card: GazettePostCard; display?: PostCardDisplay }) {
  const show = {
    image: display?.showImage !== false,
    excerpt: display?.showExcerpt !== false,
    author: display?.showAuthor !== false,
    date: display?.showDate !== false,
    comments: display?.showComments !== false,
    views: display?.showViews === true,
  }

  return (
    <Link href={card.href} className="gz-post-card">
      {show.image && card.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={card.imageUrl} alt="" />
      )}
      <div className="gz-post-card-body">
        <h3>{card.title}</h3>
        {show.excerpt && card.excerpt && <p>{card.excerpt}</p>}
        <div className="gz-post-card-meta">
          {show.author && card.authorName && <span>{card.authorName}</span>}
          {show.date && card.dateLabel && <span>{card.dateLabel}</span>}
          {show.comments && card.commentCount > 0 && <span>{card.commentCount} comments</span>}
          {show.views && <span>{card.viewCount} views</span>}
        </div>
      </div>
    </Link>
  )
}
