import { connection } from 'next/server'
import { getVisiblePostBySlug } from '@/modules/gazette/lib/db'
import { getGazetteSettings } from '@/modules/gazette/lib/settings'
import RelatedPosts from '@/modules/gazette/components/public/RelatedPosts'
import GazetteStyles from '@/modules/gazette/components/public/GazetteStyles'

// entrySlug is injected by the post page (lib/inject-entry-context.ts)
export type GazetteRelatedPostsProps = { entrySlug?: string }

export function GazetteRelatedPostsBlock() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', opacity: 0.6 }}>
      {[0, 1, 2].map((i) => <div key={i} style={{ height: 160, background: 'var(--color-border)', borderRadius: 8 }} />)}
    </div>
  )
}

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

export const gazetteRelatedPostsPuckComponent = {
  label: 'Gazette: Related Posts',
  fields: {},
  defaultProps: {},
  render: GazetteRelatedPostsBlock,
}

export const gazetteRelatedPostsPuckRscComponent = { ...gazetteRelatedPostsPuckComponent, render: GazetteRelatedPostsBlockRsc }
