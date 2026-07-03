import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getVisiblePosts } from '@/modules/gazette/lib/db'
import { getGazetteSettings } from '@/modules/gazette/lib/settings'
import GazetteStyles from '@/modules/gazette/components/public/GazetteStyles'
import PostGrid from '@/modules/gazette/components/public/PostGrid'
import Pagination from '@/modules/gazette/components/public/Pagination'

type Props = { params: Promise<{ year: string; month: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function getPage(sp: Record<string, string | string[] | undefined>): number {
  const raw = sp.page
  const val = Array.isArray(raw) ? raw[0] : raw
  return Math.max(1, parseInt(val ?? '1', 10) || 1)
}

function parseYearMonth(yearStr: string, monthStr: string): { year: number; month: number } | null {
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  if (!Number.isInteger(year) || yearStr.length !== 4) return null
  if (!Number.isInteger(month) || monthStr.length !== 2 || month < 1 || month > 12) return null
  return { year, month }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year, month } = await params
  const parsed = parseYearMonth(year, month)
  if (!parsed) return {}
  return { title: `${MONTH_NAMES[parsed.month - 1]} ${parsed.year} archive - Gazette` }
}

export default async function GazetteArchiveMonthPage({ params, searchParams }: Props) {
  const { year: yearStr, month: monthStr } = await params
  const parsed = parseYearMonth(yearStr, monthStr)
  if (!parsed) notFound()

  const settings = await getGazetteSettings()
  const sp = await searchParams
  const page = getPage(sp)
  const { posts, total } = await getVisiblePosts({ page, perPage: settings.postsPerPage, year: parsed.year, month: parsed.month })
  const totalPages = Math.max(1, Math.ceil(total / settings.postsPerPage))

  return (
    <div className="gz-wide">
      <GazetteStyles />
      <h1>{MONTH_NAMES[parsed.month - 1]} {parsed.year} archive</h1>
      <PostGrid posts={posts} showViewCounts={settings.showViewCounts} />
      <Pagination page={page} totalPages={totalPages} baseUrl={`/gazette/archive/${yearStr}/${monthStr}`} />
    </div>
  )
}
