import { connection } from 'next/server'
import { getVisiblePosts } from '@/modules/gazette/lib/db'
import { getGazetteSettings } from '@/modules/gazette/lib/settings'
import PostGrid from '@/modules/gazette/components/public/PostGrid'
import Pagination from '@/modules/gazette/components/public/Pagination'
import GazetteStyles from '@/modules/gazette/components/public/GazetteStyles'

// [ANCHOR] - mode/page/baseUrl/filter values are all injected by the listing
// pages (lib/inject-category-context.ts) - this block has no configurable
// Puck fields of its own, mirroring Shop's anchor blocks.
export type GazetteEntryListProps = {
  page?: number
  baseUrl?: string
  tagSlug?: string
  seriesSlug?: string
  authorId?: string
  year?: number
  month?: number
}

export function GazetteEntryList() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', opacity: 0.6 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ height: 220, background: 'var(--color-border)', borderRadius: 8 }} />
      ))}
    </div>
  )
}

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

export const gazetteEntryListPuckComponent = {
  label: 'Gazette: Entry List [Anchor]',
  fields: {},
  defaultProps: {},
  permissions: { delete: false, duplicate: false },
  render: GazetteEntryList,
}

export const gazetteEntryListPuckRscComponent = { ...gazetteEntryListPuckComponent, render: GazetteEntryListRsc }
