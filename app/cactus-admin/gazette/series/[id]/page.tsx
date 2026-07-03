import { getSessionFromCookie } from '@/lib/auth/session'
import { getGazetteAccess, canViewGazetteAdmin } from '@/modules/gazette/lib/permissions'
import { getSeriesById, getSeriesPosts } from '@/modules/gazette/lib/db'
import GazetteNav from '@/modules/gazette/components/admin/GazetteNav'
import SeriesReorder from '@/modules/gazette/components/admin/SeriesReorder'
import { notFound } from 'next/navigation'

export const metadata = { title: 'Edit Series — Gazette Admin' }

type Params = { params: Promise<{ id: string }> }

export default async function SeriesDetailPage({ params }: Params) {
  const user = await getSessionFromCookie()
  if (!user) return null
  const access = await getGazetteAccess(user)
  if (!canViewGazetteAdmin(access)) {
    return <div className="alert alert-danger">You do not have permission to manage the gazette.</div>
  }

  const { id } = await params
  const series = await getSeriesById(id)
  if (!series) notFound()
  const posts = await getSeriesPosts(id)

  return (
    <div>
      <GazetteNav access={access} />
      <div className="page-header">
        <h1 className="page-title">{series.title}</h1>
      </div>
      <SeriesReorder series={series} posts={posts} isEditor={access.isEditor} />
    </div>
  )
}
