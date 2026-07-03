import { getSessionFromCookie } from '@/lib/auth/session'
import { getGazetteAccess, canViewGazetteAdmin, canEditPost, canPublishPost } from '@/modules/gazette/lib/permissions'
import { getPostById, getTagIdsForPost, listTags, listSeries, listAuthors } from '@/modules/gazette/lib/db'
import GazetteNav from '@/modules/gazette/components/admin/GazetteNav'
import PostEditor from '@/modules/gazette/components/admin/PostEditor'
import { notFound } from 'next/navigation'

export const metadata = { title: 'Edit Post — Gazette Admin' }

type Params = { params: Promise<{ id: string }> }

export default async function PostEditorPage({ params }: Params) {
  const user = await getSessionFromCookie()
  if (!user) return null
  const access = await getGazetteAccess(user)
  if (!canViewGazetteAdmin(access)) {
    return <div className="alert alert-danger">You do not have permission to manage the gazette.</div>
  }

  const { id } = await params
  const post = await getPostById(id)
  if (!post) notFound()
  if (!canEditPost(access, user.id, post)) {
    return <div className="alert alert-danger">You do not have permission to edit this post.</div>
  }

  const [tagIds, tags, series] = await Promise.all([getTagIdsForPost(id), listTags(), listSeries()])
  const authors = access.isEditor ? await listAuthors() : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 6rem)' }}>
      <GazetteNav access={access} />
      <PostEditor
        post={{ ...post, tagIds }}
        tags={tags}
        series={series}
        authors={authors}
        currentUserId={user.id}
        canPublish={canPublishPost(access, user.id, post)}
        canReassignAuthor={access.isEditor}
      />
    </div>
  )
}
