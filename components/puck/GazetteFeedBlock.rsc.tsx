import { connection } from 'next/server'
import { getVisiblePosts } from '@/modules/gazette/lib/db'
import { toPostCards } from '@/modules/gazette/lib/post-cards'
import PostCardGrid from '@/modules/gazette/components/public/PostCardGrid'
import GazetteStyles from '@/modules/gazette/components/public/GazetteStyles'
import { gazetteFeedPuckComponent, feedColumns, type GazetteFeedBlockProps } from './GazetteFeedBlock'
import type { PostCardDisplay } from '@/modules/gazette/lib/types'

export async function GazetteFeedBlockRsc(props: GazetteFeedBlockProps) {
  await connection()

  const count = props.count ?? 3
  const { posts } = await getVisiblePosts({ page: 1, perPage: count, tagSlug: props.tagSlug || undefined })

  // This block sits on ordinary pages - a homepage row, most often - where it
  // has no business announcing an empty Gazette. Nothing published, nothing
  // drawn, which is what the block did before it had a card grid to fall back
  // on (PostCardGrid's own empty message is for the listing pages).
  if (posts.length === 0) return null

  const cards = await toPostCards(posts)

  // The feed's own toggles, plus the two things it has never shown: comment and
  // view counts belong to the listing, not to a three-card roundup.
  const display: PostCardDisplay = {
    showImage: props.showImage !== 'no',
    showExcerpt: props.showExcerpt !== 'no',
    showAuthor: props.showAuthor !== 'no',
    showDate: props.showDate !== 'no',
    showComments: false,
    showViews: false,
  }

  return (
    <>
      <GazetteStyles />
      <PostCardGrid
        cards={cards}
        columns={feedColumns(props.layout)}
        display={display}
        readMoreLabel={props.readMoreLabel || 'Read more'}
      />
    </>
  )
}
export const gazetteFeedPuckRscComponent = {
  ...gazetteFeedPuckComponent,
  render: GazetteFeedBlockRsc,
}
