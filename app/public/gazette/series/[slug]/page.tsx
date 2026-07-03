import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { getVisiblePosts } from '@/modules/gazette/lib/db'
import { getGazetteSettings } from '@/modules/gazette/lib/settings'
import GazetteStyles from '@/modules/gazette/components/public/GazetteStyles'
import PostGrid from '@/modules/gazette/components/public/PostGrid'
import Pagination from '@/modules/gazette/components/public/Pagination'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

function getPage(sp: Record<string, string | string[] | undefined>): number {
  const raw = sp.page
  const val = Array.isArray(raw) ? raw[0] : raw
  return Math.max(1, parseInt(val ?? '1', 10) || 1)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const series = await prisma.$queryRaw<Array<{ title: string }>>`SELECT "title" FROM "gz_series" WHERE "slug" = ${slug} LIMIT 1`
  if (!series[0]) return {}
  return { title: `${series[0].title} - Gazette` }
}

export default async function GazetteSeriesPage({ params, searchParams }: Props) {
  const { slug } = await params
  const series = await prisma.$queryRaw<Array<{ id: string; title: string; description: string | null }>>`
    SELECT "id","title","description" FROM "gz_series" WHERE "slug" = ${slug} LIMIT 1
  `
  if (!series[0]) notFound()

  const settings = await getGazetteSettings()
  const sp = await searchParams
  const page = getPage(sp)
  const { posts, total } = await getVisiblePosts({ page, perPage: settings.postsPerPage, seriesSlug: slug })
  const totalPages = Math.max(1, Math.ceil(total / settings.postsPerPage))

  return (
    <div className="gz-wide">
      <GazetteStyles />
      <h1>{series[0].title}</h1>
      {series[0].description && <p style={{ color: 'var(--color-text-muted)' }}>{series[0].description}</p>}
      <PostGrid posts={posts} showViewCounts={settings.showViewCounts} />
      <Pagination page={page} totalPages={totalPages} baseUrl={`/gazette/series/${slug}`} />
    </div>
  )
}
