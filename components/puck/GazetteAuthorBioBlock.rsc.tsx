import { connection } from 'next/server'
import { getVisiblePostBySlug } from '@/modules/gazette/lib/db'
import AuthorBio from '@/modules/gazette/components/public/AuthorBio'
import GazetteStyles from '@/modules/gazette/components/public/GazetteStyles'
import { gazetteAuthorBioPuckComponent, type GazetteAuthorBioProps } from './GazetteAuthorBioBlock'

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
export const gazetteAuthorBioPuckRscComponent = { ...gazetteAuthorBioPuckComponent, render: GazetteAuthorBioBlockRsc }
