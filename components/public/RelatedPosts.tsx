import { getRelatedPosts, getTagIdsForPost } from '@/modules/gazette/lib/db'
import PostGrid from './PostGrid'

export default async function RelatedPosts({ postId, showViewCounts }: { postId: string; showViewCounts: boolean }) {
  const tagIds = await getTagIdsForPost(postId)
  const related = await getRelatedPosts(postId, tagIds, 3)
  if (related.length === 0) return null

  return (
    <section style={{ marginTop: '2.5rem' }}>
      <h2>Related posts</h2>
      <PostGrid posts={related} showViewCounts={showViewCounts} />
    </section>
  )
}
