import PostCard from './PostCard'
import type { GazettePostCard, PostCardDisplay } from '@/modules/gazette/lib/types'

// The grid itself, with no data access of its own, so it can be rendered on the
// server or appended to client-side by PostListLoadMore.
//
// columns: 'Auto' (or blank) keeps the responsive auto-fill the module has
// always used; '1'-'4' pin the count on wide screens and still collapse on a
// phone - see .gz-post-grid[data-cols] in GazetteStyles.
//
// imageRatio and hover work the same way: left off they render exactly the grid
// this module has always rendered, and the rules for each value live beside the
// column ones as .gz-post-grid[data-ratio] / [data-hover].
//
// readMoreLabel is the Gazette Feed block's own: only that block puts a "Read
// more" line on a card, so left off the cards are exactly the listing's.
export default function PostCardGrid({ cards, columns, display, emptyMessage, imageRatio, hover, readMoreLabel }: {
  cards: GazettePostCard[]
  columns?: string
  display?: PostCardDisplay
  emptyMessage?: string
  imageRatio?: string
  hover?: string
  readMoreLabel?: string
}) {
  if (cards.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)' }}>{emptyMessage ?? 'Nothing published yet - check back soon.'}</p>
  }

  return (
    <div
      className="gz-post-grid"
      data-cols={columns && columns !== 'Auto' ? columns : undefined}
      data-ratio={imageRatio}
      data-hover={hover}
    >
      {cards.map((card) => <PostCard key={card.id} card={card} display={display} readMoreLabel={readMoreLabel} />)}
    </div>
  )
}
