import { getSessionFromCookie } from '@/lib/auth/session'
import { getGazetteAccess, canViewGazetteAdmin } from '@/modules/gazette/lib/permissions'
import { listTemplates } from '@/modules/gazette/lib/db'
import GazetteNav from '@/modules/gazette/components/admin/GazetteNav'
import TemplateList from '@/modules/gazette/components/admin/TemplateList'

export const metadata = { title: 'Gazette Templates — Admin' }

export default async function GazetteTemplatesPage() {
  const user = await getSessionFromCookie()
  if (!user) return null
  const access = await getGazetteAccess(user)
  if (!canViewGazetteAdmin(access)) {
    return <div className="alert alert-danger">You do not have permission to manage the gazette.</div>
  }

  const templates = await listTemplates()

  return (
    <div>
      <GazetteNav access={access} />
      <div className="page-header">
        <h1 className="page-title">Templates</h1>
      </div>
      <TemplateList templates={templates.map((t) => ({ id: t.id, title: t.title }))} isEditor={access.isEditor} />
    </div>
  )
}
