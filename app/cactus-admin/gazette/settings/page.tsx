import { getSessionFromCookie } from '@/lib/auth/session'
import { getGazetteAccess, canViewGazetteAdmin } from '@/modules/gazette/lib/permissions'
import { getGazetteSettings } from '@/modules/gazette/lib/settings'
import GazetteNav from '@/modules/gazette/components/admin/GazetteNav'
import SettingsForm from '@/modules/gazette/components/admin/SettingsForm'

export const metadata = { title: 'Gazette Settings — Admin' }

export default async function GazetteSettingsPage() {
  const user = await getSessionFromCookie()
  if (!user) return null
  const access = await getGazetteAccess(user)
  if (!canViewGazetteAdmin(access)) {
    return <div className="alert alert-danger">You do not have permission to manage the gazette.</div>
  }
  if (!access.isEditor) {
    return <div className="alert alert-danger">Only gazette editors can change settings.</div>
  }

  const settings = await getGazetteSettings()

  return (
    <div>
      <GazetteNav access={access} />
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>
      <SettingsForm settings={settings} />
    </div>
  )
}
