import { connection } from 'next/server'
import { getVisiblePosts } from '@/modules/gazette/lib/db'
import { getGazetteSettings } from '@/modules/gazette/lib/settings'
import PostGrid from '@/modules/gazette/components/public/PostGrid'
import Pagination from '@/modules/gazette/components/public/Pagination'
import GazetteStyles from '@/modules/gazette/components/public/GazetteStyles'
import { gazetteEntryListPuckComponent, type GazetteEntryListProps } from './GazetteEntryListBlock'

export async function GazetteEntryListRsc(props: GazetteEntryListProps) {
  await connection()
  const settings = await getGazetteSettings()
  const page = props.page ?? 1
  const { posts, total } = await getVisiblePosts({
    page, perPage: settings.postsPerPage,
    tagSlug: props.tagSlug, seriesSlug: props.seriesSlug, authorId: props.authorId,
    year: props.year, month: props.month,
  })
  const totalPages = Math.max(1, Math.ceil(total / settings.postsPerPage))

  return (
    <>
      <GazetteStyles />
      <PostGrid posts={posts} showViewCounts={settings.showViewCounts} />
      <Pagination page={page} totalPages={totalPages} baseUrl={props.baseUrl ?? '/gazette'} />
    </>
  )
}
export const gazetteEntryListPuckRscComponent = { ...gazetteEntryListPuckComponent, render: GazetteEntryListRsc }
