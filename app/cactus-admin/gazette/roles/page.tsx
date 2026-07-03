import { getSessionFromCookie } from '@/lib/auth/session'
import { isAdmin } from '@/lib/permissions/check'
import { getGazetteAccess } from '@/modules/gazette/lib/permissions'
import { listUserRoles } from '@/modules/gazette/lib/db'
import GazetteNav from '@/modules/gazette/components/admin/GazetteNav'
import RolesScreen from '@/modules/gazette/components/admin/RolesScreen'
import { notFound } from 'next/navigation'

export const metadata = { title: 'Gazette Roles — Admin' }

export default async function GazetteRolesPage() {
  const user = await getSessionFromCookie()
  if (!user) return null

  // Admin-only (Decision 4). A plain 404 - not a permission alert - so a
  // non-admin gazette user (including an editor) deep-linking here can't tell
  // this screen exists at all.
  if (!isAdmin(user)) notFound()

  const access = await getGazetteAccess(user)
  const roles = await listUserRoles()

  return (
    <div>
      <GazetteNav access={access} />
      <div className="page-header">
        <h1 className="page-title">Roles</h1>
      </div>
      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '-0.5rem', marginBottom: '1rem' }}>
        Core admins always have full access to the gazette.
      </p>
      <RolesScreen roles={roles} />
    </div>
  )
}
