import { connection } from 'next/server'
import { getVisiblePosts } from '@/modules/gazette/lib/db'
import { getGazetteSettings } from '@/modules/gazette/lib/settings'
import { toPostCards } from '@/modules/gazette/lib/post-cards'
import PostCardGrid from '@/modules/gazette/components/public/PostCardGrid'
import PostListLoadMore from '@/modules/gazette/components/public/PostListLoadMore'
import Pagination from '@/modules/gazette/components/public/Pagination'
import GazetteStyles from '@/modules/gazette/components/public/GazetteStyles'
import { gazetteEntryListPuckComponent, entryListRatio, entryListHover, type GazetteEntryListProps } from './GazetteEntryListBlock'
import type { GazettePostSort, PostCardDisplay } from '@/modules/gazette/lib/types'

const MAX_PER_PAGE = 48

const SORTS: Record<string, GazettePostSort> = {
  Newest: 'newest', Oldest: 'oldest', 'Most viewed': 'views', 'A to Z': 'title',
}

export async function GazetteEntryListRsc(props: GazetteEntryListProps) {
  await connection()
  const settings = await getGazetteSettings()

  const chosen = Number(props.perPage) || 0
  const perPage = chosen > 0 ? Math.min(MAX_PER_PAGE, chosen) : settings.postsPerPage
  const page = props.page ?? 1
  const sort = SORTS[props.sortBy ?? 'Newest'] ?? 'newest'
  const paging = props.paging ?? 'Pages'

  const { posts, total } = await getVisiblePosts({
    page, perPage, sort,
    tagSlug: props.tagSlug, seriesSlug: props.seriesSlug, authorId: props.authorId,
    year: props.year, month: props.month,
  })

  const display: PostCardDisplay = {
    showImage: props.showImage !== 'no',
    showExcerpt: props.showExcerpt !== 'no',
    showAuthor: props.showAuthor !== 'no',
    showDate: props.showDate !== 'no',
    showComments: props.showComments !== 'no',
    // 'auto' defers to the Gazette settings toggle, which is where view counts
    // were switched on and off before this block had a say.
    showViews: props.showViews === 'yes' || (props.showViews !== 'no' && settings.showViewCounts),
  }
  const cards = await toPostCards(posts)
  const imageRatio = entryListRatio(props.imageRatio)
  const hover = entryListHover(props.cardHover)

  if (paging === 'Load more' || paging === 'Infinite scroll') {
    return (
      <>
        <GazetteStyles />
        <PostListLoadMore
          initialCards={cards}
          initialPage={page}
          initialHasMore={page * perPage < total}
          query={{
            perPage, sort,
            tag: props.tagSlug, series: props.seriesSlug, author: props.authorUsername,
            year: props.year, month: props.month,
          }}
          mode={paging === 'Infinite scroll' ? 'infinite' : 'more'}
          columns={props.columns}
          display={display}
          loadMoreLabel={props.loadMoreLabel || 'Load more posts'}
          imageRatio={imageRatio}
          hover={hover}
        />
      </>
    )
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return (
    <>
      <GazetteStyles />
      <PostCardGrid cards={cards} columns={props.columns} display={display} imageRatio={imageRatio} hover={hover} />
      {paging !== 'None' && <Pagination page={page} totalPages={totalPages} baseUrl={props.baseUrl ?? '/gazette'} />}
    </>
  )
}
export const gazetteEntryListPuckRscComponent = { ...gazetteEntryListPuckComponent, render: GazetteEntryListRsc }
