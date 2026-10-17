import { getSessionFromCookie } from '@/lib/auth/session'
import { getGazetteAccess, canViewGazetteAdmin, canEditPost, canPublishPost } from '@/modules/gazette/lib/permissions'
import { getPostById, getTagIdsForPost, listTags, listSeries, listAuthors } from '@/modules/gazette/lib/db'
import { getPostUrlStyle } from '@/modules/gazette/lib/post-url'
import { resolveExtensionTabs } from '@/lib/modules/extension-tabs'
import { editorPanelPost } from '@/modules/gazette/lib/post-events'
import { siteUrl } from '@/modules/gazette/lib/site-url'
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

  const [tagIds, tags, series, postUrlStyle] = await Promise.all([getTagIdsForPost(id), listTags(), listSeries(), getPostUrlStyle()])
  const authors = access.isEditor ? await listAuthors() : []

  // Cards other modules add to the sidebar (`gazette.post-editor-panels`), each
  // gated by its own permission. Rendered here so a site with none pays nothing.
  const [panelDefs, panelPost] = await Promise.all([
    resolveExtensionTabs('gazette.post-editor-panels', user),
    editorPanelPost(id),
  ])
  const panels = panelPost
    ? panelDefs.map((p) => <p.Component key={`${p.moduleName}:${p.id}`} post={panelPost} />)
    : []

  return (
    // The editor takes the whole screen, like the layout editor: the way back to
    // the posts is its own back link, so the tab strip is left off this page.
    <PostEditor
      post={{ ...post, tagIds }}
      tags={tags}
      series={series}
      authors={authors}
      currentUserId={user.id}
      canPublish={canPublishPost(access, user.id, post)}
      canReassignAuthor={access.isEditor}
      canSaveTemplate={access.isEditor}
      postUrlStyle={postUrlStyle}
      panels={panels}
      siteBase={siteUrl()}
      initialImageUrl={panelPost?.imageUrl ?? null}
    />
  )
}
