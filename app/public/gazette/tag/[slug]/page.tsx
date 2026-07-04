import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Render } from '@puckeditor/core/rsc'
import { prisma } from '@/lib/db/prisma'
import { getVisiblePosts } from '@/modules/gazette/lib/db'
import { getGazetteSettings } from '@/modules/gazette/lib/settings'
import GazetteStyles from '@/modules/gazette/components/public/GazetteStyles'
import PostGrid from '@/modules/gazette/components/public/PostGrid'
import Pagination from '@/modules/gazette/components/public/Pagination'
import { resolveThemeLayout } from '@/lib/layout/resolveThemeLayout'
import { getModuleLayoutPuckRscConfig } from '@/lib/puck/config.rsc'
import { injectCategoryContext } from '@/modules/gazette/lib/inject-category-context'
import type { PuckData } from '@/modules/gazette/lib/types'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

function getPage(sp: Record<string, string | string[] | undefined>): number {
  const raw = sp.page
  const val = Array.isArray(raw) ? raw[0] : raw
  return Math.max(1, parseInt(val ?? '1', 10) || 1)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const tag = await prisma.$queryRaw<Array<{ name: string }>>`SELECT "name" FROM "gz_tags" WHERE "slug" = ${slug} LIMIT 1`
  if (!tag[0]) return {}
  return { title: `${tag[0].name} - Gazette` }
}

export default async function GazetteTagPage({ params, searchParams }: Props) {
  const { slug } = await params
  const tag = await prisma.$queryRaw<Array<{ id: string; name: string }>>`SELECT "id","name" FROM "gz_tags" WHERE "slug" = ${slug} LIMIT 1`
  if (!tag[0]) notFound()

  const settings = await getGazetteSettings()
  const sp = await searchParams
  const page = getPage(sp)

  const layout = await resolveThemeLayout('gazetteCategory', { moduleName: 'gazette' })
  if (layout?.builderData) {
    const data = injectCategoryContext(layout.builderData as PuckData, {
      heading: `Tag: ${tag[0].name}`, page, baseUrl: `/gazette/tag/${slug}`, tagSlug: slug,
    })
    return <Render config={getModuleLayoutPuckRscConfig('gazetteCategory') as any} data={data as any} />
  }

  const { posts, total } = await getVisiblePosts({ page, perPage: settings.postsPerPage, tagSlug: slug })
  const totalPages = Math.max(1, Math.ceil(total / settings.postsPerPage))

  return (
    <div className="gz-wide">
      <GazetteStyles />
      <h1>Tag: {tag[0].name}</h1>
      <PostGrid posts={posts} showViewCounts={settings.showViewCounts} />
      <Pagination page={page} totalPages={totalPages} baseUrl={`/gazette/tag/${slug}`} />
    </div>
  )
}
