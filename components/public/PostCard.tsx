import Link from 'next/link'
import type { GazettePostCard, PostCardDisplay } from '@/modules/gazette/lib/types'

// Presentational only - no data access - so the load-more list can render the
// same card client-side as the server did.
export default function PostCard({ card, display, readMoreLabel, eagerImage = false }: {
  card: GazettePostCard
  display?: PostCardDisplay
  // Only the Gazette Feed block asks for this; the listing's cards carry no
  // prompt of their own, the whole card being the link.
  readMoreLabel?: string
  // Whether the picture may load before it is scrolled near. Off by default,
  // because a card with no loading attribute at all is one React announces in
  // the page head as a picture to fetch first - which put three blog thumbnails
  // at the foot of a shop's homepage in the queue ahead of its hero. Only a
  // caller that knows its cards open the page should turn it on.
  eagerImage?: boolean
}) {
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
        <img src={card.imageUrl} alt="" loading={eagerImage ? 'eager' : 'lazy'} decoding="async" />
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
        {readMoreLabel && <span className="gz-post-card-more">{readMoreLabel}</span>}
      </div>
    </Link>
  )
}
