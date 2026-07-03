import { getSessionFromCookie } from '@/lib/auth/session'
import { getGazetteAccess, canViewGazetteAdmin } from '@/modules/gazette/lib/permissions'
import { getAuthorProfile } from '@/modules/gazette/lib/db'
import GazetteNav from '@/modules/gazette/components/admin/GazetteNav'
import AuthorProfileForm from '@/modules/gazette/components/admin/AuthorProfileForm'

export const metadata = { title: 'Author Profile — Gazette Admin' }

type Params = { params: Promise<{ userId: string }> }

export default async function AuthorProfilePage({ params }: Params) {
  const user = await getSessionFromCookie()
  if (!user) return null
  const access = await getGazetteAccess(user)
  if (!canViewGazetteAdmin(access)) {
    return <div className="alert alert-danger">You do not have permission to manage the gazette.</div>
  }

  const { userId } = await params
  if (!access.isEditor && userId !== user.id) {
    return <div className="alert alert-danger">You can only edit your own author profile.</div>
  }

  const profile = await getAuthorProfile(userId)

  return (
    <div>
      <GazetteNav access={access} />
      <div className="page-header">
        <h1 className="page-title">Author Profile</h1>
      </div>
      <AuthorProfileForm userId={userId} bio={profile?.bio ?? ''} avatarId={profile?.avatarId ?? ''} />
    </div>
  )
}
