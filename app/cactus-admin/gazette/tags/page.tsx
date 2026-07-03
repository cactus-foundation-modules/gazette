import { getSessionFromCookie } from '@/lib/auth/session'
import { getGazetteAccess, canViewGazetteAdmin } from '@/modules/gazette/lib/permissions'
import { getTagsWithCounts } from '@/modules/gazette/lib/db'
import GazetteNav from '@/modules/gazette/components/admin/GazetteNav'
import TagsScreen from '@/modules/gazette/components/admin/TagsScreen'

export const metadata = { title: 'Gazette Tags — Admin' }

export default async function GazetteTagsPage() {
  const user = await getSessionFromCookie()
  if (!user) return null
  const access = await getGazetteAccess(user)
  if (!canViewGazetteAdmin(access)) {
    return <div className="alert alert-danger">You do not have permission to manage the gazette.</div>
  }

  const tags = await getTagsWithCounts()

  return (
    <div>
      <GazetteNav access={access} />
      <div className="page-header">
        <h1 className="page-title">Tags</h1>
      </div>
      <TagsScreen tags={tags} isEditor={access.isEditor} />
    </div>
  )
}
