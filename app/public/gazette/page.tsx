import type { Metadata } from 'next'
import { Render } from '@puckeditor/core/rsc'
import { getVisiblePosts } from '@/modules/gazette/lib/db'
import { getGazetteSettings } from '@/modules/gazette/lib/settings'
import GazetteStyles from '@/modules/gazette/components/public/GazetteStyles'
import PostGrid from '@/modules/gazette/components/public/PostGrid'
import Pagination from '@/modules/gazette/components/public/Pagination'
import { resolveThemeLayout } from '@/lib/layout/resolveThemeLayout'
import { getModuleLayoutPuckRscConfig } from '@/lib/puck/config.rsc'
import { injectCategoryContext } from '@/modules/gazette/lib/inject-category-context'
import type { PuckData } from '@/modules/gazette/lib/types'

type Props = { params: Promise<Record<string, string>>; searchParams: Promise<Record<string, string | string[] | undefined>> }

function getPage(sp: Record<string, string | string[] | undefined>): number {
  const raw = sp.page
  const val = Array.isArray(raw) ? raw[0] : raw
  return Math.max(1, parseInt(val ?? '1', 10) || 1)
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const settings = await getGazetteSettings()
  const sp = await searchParams
  const page = getPage(sp)
  const title = settings.feedTitle ?? 'Gazette'
  return { title: page > 1 ? `${title} - Page ${page}` : title }
}

export default async function GazetteIndexPage({ searchParams }: Props) {
  const settings = await getGazetteSettings()
  const sp = await searchParams
  const page = getPage(sp)

  const layout = await resolveThemeLayout('gazetteCategory', { moduleName: 'gazette' })
  if (layout?.builderData) {
    const data = injectCategoryContext(layout.builderData as PuckData, {
      heading: settings.feedTitle ?? 'Gazette', description: settings.feedDescription, page, baseUrl: '/gazette',
    })
    return <Render config={getModuleLayoutPuckRscConfig('gazetteCategory') as any} data={data as any} />
  }

  const { posts, total } = await getVisiblePosts({ page, perPage: settings.postsPerPage })
  const totalPages = Math.max(1, Math.ceil(total / settings.postsPerPage))

  return (
    <div className="gz-wide">
      <GazetteStyles />
      <h1>{settings.feedTitle ?? 'Gazette'}</h1>
      {settings.feedDescription && <p style={{ color: 'var(--color-text-muted)' }}>{settings.feedDescription}</p>}
      <PostGrid posts={posts} showViewCounts={settings.showViewCounts} />
      <Pagination page={page} totalPages={totalPages} baseUrl="/gazette" />
    </div>
  )
}
