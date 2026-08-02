import { getSessionFromCookie } from '@/lib/auth/session'
import { getGazetteAccess, canViewGazetteAdmin } from '@/modules/gazette/lib/permissions'
import { listComments, getPostTitlesByIds } from '@/modules/gazette/lib/db'
import GazetteNav from '@/modules/gazette/components/admin/GazetteNav'
import CommentsScreen from '@/modules/gazette/components/admin/CommentsScreen'

export const metadata = { title: 'Gazette Comments — Admin' }

type Props = { searchParams: Promise<Record<string, string>> }

export default async function GazetteCommentsPage({ searchParams }: Props) {
  const user = await getSessionFromCookie()
  if (!user) return null
  const access = await getGazetteAccess(user)
  if (!canViewGazetteAdmin(access)) {
    return <div className="alert alert-danger">You do not have permission to manage the gazette.</div>
  }
  if (!access.isEditor) {
    return <div className="alert alert-danger">Only gazette editors can moderate comments.</div>
  }

  const sp = await searchParams
  const status = sp.status ?? 'PENDING'
  // Clamped and NaN-proofed - a mistyped ?page= otherwise reached listComments
  // as NaN and rendered an error page instead of page one.
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)

  const { comments, total } = await listComments({ status, page, perPage: 25 })
  const postIds = [...new Set(comments.map((c) => c.postId))]
  const postTitleById = await getPostTitlesByIds(postIds)

  return (
    <div>
      <GazetteNav access={access} />
      <div className="page-header">
        <h1 className="page-title">Comments</h1>
      </div>
      <CommentsScreen
        comments={comments.map((c) => ({ ...c, postTitle: postTitleById[c.postId] ?? 'Unknown post' }))}
        total={total}
        page={page}
        status={status}
      />
    </div>
  )
}
