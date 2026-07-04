import { connection } from 'next/server'
import { getVisiblePostBySlug, getReactionCounts } from '@/modules/gazette/lib/db'
import { getGazetteSettings } from '@/modules/gazette/lib/settings'
import PostBody from '@/modules/gazette/components/public/PostBody'
import Reactions from '@/modules/gazette/components/public/Reactions'
import ShareButtons from '@/modules/gazette/components/public/ShareButtons'
import GazetteStyles from '@/modules/gazette/components/public/GazetteStyles'

// [ANCHOR] - entrySlug is injected by the post page (lib/inject-entry-context.ts).
// Nests a <Render> of the post's own body content, plus the post-content
// actions (reactions, share) that don't need their own independently
// repositionable region.
export type GazettePostBodyProps = { entrySlug?: string }

function siteUrl(): string {
  return process.env.SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
}

export function GazettePostBody() {
  return (
    <div style={{ opacity: 0.6, display: 'grid', gap: '0.75rem' }}>
      {[0, 1, 2, 3].map((i) => <div key={i} style={{ height: 16, width: `${90 - i * 10}%`, background: 'var(--color-border)', borderRadius: 4 }} />)}
    </div>
  )
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

export const gazettePostBodyPuckComponent = {
  label: 'Gazette: Post Body [Anchor]',
  fields: {},
  defaultProps: {},
  permissions: { delete: false, duplicate: false },
  render: GazettePostBody,
}

export const gazettePostBodyPuckRscComponent = { ...gazettePostBodyPuckComponent, render: GazettePostBodyRsc }
