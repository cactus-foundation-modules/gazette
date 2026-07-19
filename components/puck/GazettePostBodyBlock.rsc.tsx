import { connection } from 'next/server'
import { getVisiblePostBySlug, getReactionCounts } from '@/modules/gazette/lib/db'
import { getGazetteSettings } from '@/modules/gazette/lib/settings'
import PostBody from '@/modules/gazette/components/public/PostBody'
import Reactions from '@/modules/gazette/components/public/Reactions'
import ShareButtons from '@/modules/gazette/components/public/ShareButtons'
import GazetteStyles from '@/modules/gazette/components/public/GazetteStyles'
import { gazettePostBodyPuckComponent, type GazettePostBodyProps } from './GazettePostBodyBlock'

// Server-only: reads SITE_URL/VERCEL_URL, so it belongs on this side of the
// split rather than in the editor half.
function siteUrl(): string {
  return process.env.SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
}

export async function GazettePostBodyRsc(props: GazettePostBodyProps) {
  await connection()
  if (!props.entrySlug) return null
  const post = await getVisiblePostBySlug(props.entrySlug)
  if (!post) return null

  const [settings, reactionCounts] = await Promise.all([
    getGazetteSettings(),
    getReactionCounts(post.id),
  ])

  return (
    <div>
      <GazetteStyles />
      <PostBody builderData={post.builderData} />
      {settings.reactionsEnabled && (
        <Reactions postId={post.id} reactionSet={settings.reactionSet ?? []} initialCounts={reactionCounts} />
      )}
      <ShareButtons url={`${siteUrl()}/gazette/${post.slug}`} title={post.title} />
    </div>
  )
}
export const gazettePostBodyPuckRscComponent = { ...gazettePostBodyPuckComponent, render: GazettePostBodyRsc }
