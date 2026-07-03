import { getSessionFromCookie } from '@/lib/auth/session'
import { getGazetteAccess, canViewGazetteAdmin } from '@/modules/gazette/lib/permissions'
import { listSeries } from '@/modules/gazette/lib/db'
import GazetteNav from '@/modules/gazette/components/admin/GazetteNav'
import SeriesScreen from '@/modules/gazette/components/admin/SeriesScreen'

export const metadata = { title: 'Gazette Series — Admin' }

export default async function GazetteSeriesPage() {
  const user = await getSessionFromCookie()
  if (!user) return null
  const access = await getGazetteAccess(user)
  if (!canViewGazetteAdmin(access)) {
    return <div className="alert alert-danger">You do not have permission to manage the gazette.</div>
  }

  const series = await listSeries()

  return (
    <div>
      <GazetteNav access={access} />
      <div className="page-header">
        <h1 className="page-title">Series</h1>
      </div>
      <SeriesScreen series={series} isEditor={access.isEditor} />
    </div>
  )
}
