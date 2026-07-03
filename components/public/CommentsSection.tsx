import { getApprovedCommentsForPost } from '@/modules/gazette/lib/db'
import CommentForm from './CommentForm'
import type { GazetteSettings } from '@/modules/gazette/lib/types'

export default async function CommentsSection({ postId, settings, loggedIn }: {
  postId: string
  settings: GazetteSettings
  loggedIn: boolean
}) {
  if (!settings.commentsEnabled) return null

  const comments = await getApprovedCommentsForPost(postId)
  const topLevel = comments.filter((c) => !c.parentId)
  const repliesByParent = new Map<string, typeof comments>()
  for (const c of comments) {
    if (c.parentId) {
      const list = repliesByParent.get(c.parentId) ?? []
      list.push(c)
      repliesByParent.set(c.parentId, list)
    }
  }

  return (
    <section className="gz-comments">
      <h2>Comments {comments.length > 0 && `(${comments.length})`}</h2>

      {topLevel.length === 0 && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No comments yet.</p>}

      {topLevel.map((c) => (
        <div key={c.id} className="gz-comment">
          <div className="gz-comment-meta">{c.authorName} · {new Date(c.createdAt).toLocaleDateString('en-GB')}</div>
          <p>{c.body}</p>
          {(repliesByParent.get(c.id) ?? []).map((r) => (
            <div key={r.id} className="gz-comment gz-comment-reply">
              <div className="gz-comment-meta">{r.authorName} · {new Date(r.createdAt).toLocaleDateString('en-GB')}</div>
              <p>{r.body}</p>
            </div>
          ))}
        </div>
      ))}

      <div style={{ marginTop: '1.5rem' }}>
        <CommentForm postId={postId} loggedIn={loggedIn} commentsVisibility={settings.commentsVisibility} />
      </div>
    </section>
  )
}
