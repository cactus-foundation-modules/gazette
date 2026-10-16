import { notFound } from 'next/navigation'
import { getSessionFromCookie } from '@/lib/auth/session'
import { resolveExtensionTabs } from '@/lib/modules/extension-tabs'
import { getGazetteAccess, canViewGazetteAdmin } from '@/modules/gazette/lib/permissions'
import { listPostsForTabs } from '@/modules/gazette/lib/tab-posts'
import GazetteNav from '@/modules/gazette/components/admin/GazetteNav'

export const metadata = { title: 'Gazette — Admin' }

type Props = { params: Promise<{ tab: string }> }

// Home for any tab another module publishes into `gazette.admin-tabs`, opened at
// /m/gazette/<tab id>. The router tries Gazette's own fixed pages (posts, tags,
// series...) before this one, so it only ever sees a path nothing else claims. The
// tab is handed the posts the signed-in person may see, already carrying their
// public addresses; everything else it needs, it fetches from its own module.
export default async function GazetteExtensionTabPage({ params }: Props) {
  const user = await getSessionFromCookie()
  if (!user) return null
  const access = await getGazetteAccess(user)
  if (!canViewGazetteAdmin(access)) {
    return <div className="alert alert-danger">You do not have permission to manage the gazette.</div>
  }

  const { tab } = await params
  const active = (await resolveExtensionTabs('gazette.admin-tabs', user)).find((t) => t.id === tab)
  if (!active) notFound()

  const posts = await listPostsForTabs(access.isEditor ? undefined : user.id)

  return (
    <div>
      <GazetteNav access={access} />
      <div className="page-header">
        <h1 className="page-title">{active.label}</h1>
      </div>
      <active.Component posts={posts} />
    </div>
  )
}
