import { connection } from 'next/server'
import { getSessionFromCookie } from '@/lib/auth/session'
import { getVisiblePostBySlug } from '@/modules/gazette/lib/db'
import { getGazetteSettings } from '@/modules/gazette/lib/settings'
import CommentsSection from '@/modules/gazette/components/public/CommentsSection'
import GazetteStyles from '@/modules/gazette/components/public/GazetteStyles'

// entrySlug is injected by the post page (lib/inject-entry-context.ts)
export type GazetteCommentsProps = { entrySlug?: string }

export function GazetteCommentsBlock() {
  return <div style={{ height: 160, background: 'var(--color-border)', borderRadius: 8, opacity: 0.6 }} />
}

export async function GazetteCommentsBlockRsc(props: GazetteCommentsProps) {
  await connection()
  if (!props.entrySlug) return null
  const post = await getVisiblePostBySlug(props.entrySlug)
  if (!post) return null

  const [settings, user] = await Promise.all([
    getGazetteSettings(),
    getSessionFromCookie().catch(() => null),
  ])

  return (
    <>
      <GazetteStyles />
      <CommentsSection postId={post.id} settings={settings} loggedIn={!!user} />
    </>
  )
}

export const gazetteCommentsPuckComponent = {
  label: 'Gazette: Comments',
  fields: {},
  defaultProps: {},
  render: GazetteCommentsBlock,
}

export const gazetteCommentsPuckRscComponent = { ...gazetteCommentsPuckComponent, render: GazetteCommentsBlockRsc }
