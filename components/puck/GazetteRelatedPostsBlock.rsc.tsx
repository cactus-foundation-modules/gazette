import { connection } from 'next/server'
import { getVisiblePostBySlug } from '@/modules/gazette/lib/db'
import { getGazetteSettings } from '@/modules/gazette/lib/settings'
import RelatedPosts from '@/modules/gazette/components/public/RelatedPosts'
import GazetteStyles from '@/modules/gazette/components/public/GazetteStyles'
import { gazetteRelatedPostsPuckComponent, type GazetteRelatedPostsProps } from './GazetteRelatedPostsBlock'

export async function GazetteRelatedPostsBlockRsc(props: GazetteRelatedPostsProps) {
  await connection()
  if (!props.entrySlug) return null
  const post = await getVisiblePostBySlug(props.entrySlug)
  if (!post) return null
  const settings = await getGazetteSettings()
  return (
    <>
      <GazetteStyles />
      <RelatedPosts postId={post.id} showViewCounts={settings.showViewCounts} />
    </>
  )
}
export const gazetteRelatedPostsPuckRscComponent = { ...gazetteRelatedPostsPuckComponent, render: GazetteRelatedPostsBlockRsc }
