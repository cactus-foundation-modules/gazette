import PostCardGrid from './PostCardGrid'
import { toPostCards } from '@/modules/gazette/lib/post-cards'
import type { GazettePostListItem, PostCardDisplay } from '@/modules/gazette/lib/types'

// How many cards open a listing page with their pictures fetched at once. The
// hardcoded listing pages put the grid directly under a short heading, so its
// first row is on screen as the page arrives; three is that row on the widest
// layout the auto-fill grid produces. Past it every picture waits to be
// scrolled near, the same as on any other page.
const LISTING_FIRST_ROW_CARDS = 3

// Server wrapper: post rows in, cards out. The hardcoded listing pages still
// call it with just posts + showViewCounts; the Entry List block passes the
// column count and display toggles the page builder collected.
export default async function PostGrid({ posts, showViewCounts, columns, display }: {
  posts: GazettePostListItem[]
  showViewCounts: boolean
  columns?: string
  display?: PostCardDisplay
}) {
  const cards = await toPostCards(posts)
  return (
    <PostCardGrid
      cards={cards}
      columns={columns}
      display={{ showViews: showViewCounts, ...display }}
      eagerImageCount={LISTING_FIRST_ROW_CARDS}
    />
  )
}
