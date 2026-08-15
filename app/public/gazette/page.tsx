import type { Metadata } from 'next'
import { Render } from '@puckeditor/core/rsc'
import { getVisiblePosts, resolveAuthorIdByUsername } from '@/modules/gazette/lib/db'
import { getGazetteSettings } from '@/modules/gazette/lib/settings'
import GazetteStyles from '@/modules/gazette/components/public/GazetteStyles'
import PostGrid from '@/modules/gazette/components/public/PostGrid'
import Pagination from '@/modules/gazette/components/public/Pagination'
import { resolveThemeLayout } from '@/lib/layout/resolveThemeLayout'
import { getModuleLayoutPuckRscConfig } from '@/lib/puck/config.rsc'
import { injectCategoryContext } from '@/modules/gazette/lib/inject-category-context'
import { filterQueryString, type GazetteFilterState } from '@/modules/gazette/lib/filter-links'
import type { PuckData } from '@/modules/gazette/lib/types'

type Props = { params: Promise<Record<string, string>>; searchParams: Promise<Record<string, string | string[] | undefined>> }

function getPage(sp: Record<string, string | string[] | undefined>): number {
  const raw = sp.page
  const val = Array.isArray(raw) ? raw[0] : raw
  return Math.max(1, parseInt(val ?? '1', 10) || 1)
}

// The listing filter blocks link here with ?series=&author=&tag=, which is how
// more than one filter can be on at once - the /gazette/tag/<slug> style routes
// each pin exactly one and stay the canonical single-filter page.
function getFilters(sp: Record<string, string | string[] | undefined>): GazetteFilterState {
  const one = (raw: string | string[] | undefined) => {
    const val = (Array.isArray(raw) ? raw[0] : raw)?.trim()
    return val ? val : undefined
  }
  return { series: one(sp.series), author: one(sp.author), tag: one(sp.tag) }
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const settings = await getGazetteSettings()
  const sp = await searchParams
  const page = getPage(sp)
  const filters = getFilters(sp)
  const title = settings.feedTitle ?? 'Gazette'
  const filtered = !!(filters.series || filters.author || filters.tag)
  return {
    title: page > 1 ? `${title} - Page ${page}` : title,
    // A filtered view is a slice of pages that are already indexed on their own
    // canonical routes, and the combinations multiply. Let crawlers follow the
    // links out of it without filing every permutation as its own page.
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function GazetteIndexPage({ searchParams }: Props) {
  const settings = await getGazetteSettings()
  const sp = await searchParams
  const page = getPage(sp)

  const filters = getFilters(sp)
  // An unknown username filters nothing rather than 404s - the rest of the
  // listing still works, and the chip for it simply won't read as active.
  const authorId = filters.author ? await resolveAuthorIdByUsername(filters.author) : null
  const active: GazetteFilterState = { ...filters, author: authorId ? filters.author : undefined }
  const baseUrl = `/gazette${filterQueryString(active)}`
  const postFilters = { tagSlug: active.tag, seriesSlug: active.series, authorId: authorId ?? undefined }

  const layout = await resolveThemeLayout('gazetteCategory', { moduleName: 'gazette' })
  if (layout?.builderData) {
    const data = injectCategoryContext(layout.builderData as PuckData, {
      heading: settings.feedTitle ?? 'Gazette', description: settings.feedDescription, page, baseUrl,
      tagSlug: active.tag, seriesSlug: active.series, authorId: authorId ?? undefined, authorUsername: active.author,
    })
    return <Render config={getModuleLayoutPuckRscConfig('gazetteCategory') as any} data={data as any} />
  }

  const { posts, total } = await getVisiblePosts({ page, perPage: settings.postsPerPage, ...postFilters })
  const totalPages = Math.max(1, Math.ceil(total / settings.postsPerPage))

  return (
    <div className="gz-wide">
      <GazetteStyles />
      <h1>{settings.feedTitle ?? 'Gazette'}</h1>
      {settings.feedDescription && <p style={{ color: 'var(--color-text-muted)' }}>{settings.feedDescription}</p>}
      <PostGrid posts={posts} showViewCounts={settings.showViewCounts} />
      <Pagination page={page} totalPages={totalPages} baseUrl={baseUrl} />
    </div>
  )
}
