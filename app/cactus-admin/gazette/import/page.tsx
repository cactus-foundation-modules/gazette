import { getSessionFromCookie } from '@/lib/auth/session'
import { getGazetteAccess, canViewGazetteAdmin } from '@/modules/gazette/lib/permissions'
import GazetteNav from '@/modules/gazette/components/admin/GazetteNav'
import ImportWizard from '@/modules/gazette/components/admin/ImportWizard'

export const metadata = { title: 'Import — Gazette Admin' }

export default async function GazetteImportPage() {
  const user = await getSessionFromCookie()
  if (!user) return null
  const access = await getGazetteAccess(user)
  if (!canViewGazetteAdmin(access)) {
    return <div className="alert alert-danger">You do not have permission to manage the gazette.</div>
  }
  if (!access.isEditor) {
    return <div className="alert alert-danger">Only gazette editors can import posts.</div>
  }

  return (
    <div>
      <GazetteNav access={access} />
      <div className="page-header">
        <h1 className="page-title">Import</h1>
      </div>
      <ImportWizard />
    </div>
  )
}
