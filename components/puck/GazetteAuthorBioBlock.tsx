import { connection } from 'next/server'
import { getVisiblePostBySlug } from '@/modules/gazette/lib/db'
import AuthorBio from '@/modules/gazette/components/public/AuthorBio'
import GazetteStyles from '@/modules/gazette/components/public/GazetteStyles'

// entrySlug is injected by the post page (lib/inject-entry-context.ts)
export type GazetteAuthorBioProps = { entrySlug?: string }

export function GazetteAuthorBioBlock() {
  return <div style={{ height: 80, background: 'var(--color-border)', borderRadius: 8, opacity: 0.6 }} />
}

export async function GazetteAuthorBioBlockRsc(props: GazetteAuthorBioProps) {
  await connection()
  if (!props.entrySlug) return null
  const post = await getVisiblePostBySlug(props.entrySlug)
  if (!post) return null
  return (
    <>
      <GazetteStyles />
      <AuthorBio authorId={post.authorId} importedAuthorName={post.importedAuthorName} />
    </>
  )
}

export const gazetteAuthorBioPuckComponent = {
  label: 'Gazette: Author Bio',
  fields: {},
  defaultProps: {},
  render: GazetteAuthorBioBlock,
}

export const gazetteAuthorBioPuckRscComponent = { ...gazetteAuthorBioPuckComponent, render: GazetteAuthorBioBlockRsc }
