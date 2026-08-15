import PostCardGrid from './PostCardGrid'
import { toPostCards } from '@/modules/gazette/lib/post-cards'
import type { GazettePostListItem, PostCardDisplay } from '@/modules/gazette/lib/types'

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
    />
  )
}
