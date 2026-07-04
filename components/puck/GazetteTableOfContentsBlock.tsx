import { connection } from 'next/server'
import { getVisiblePostBySlug } from '@/modules/gazette/lib/db'
import { extractHeadings } from '@/modules/gazette/lib/toc'
import TableOfContents from '@/modules/gazette/components/public/TableOfContents'
import GazetteStyles from '@/modules/gazette/components/public/GazetteStyles'

// entrySlug is injected by the post page (lib/inject-entry-context.ts)
export type GazetteTableOfContentsProps = { entrySlug?: string }

export function GazetteTableOfContentsBlock() {
  return <div style={{ height: 120, width: '30%', background: 'var(--color-border)', borderRadius: 8, opacity: 0.6 }} />
}

export async function GazetteTableOfContentsBlockRsc(props: GazetteTableOfContentsProps) {
  await connection()
  if (!props.entrySlug) return null
  const post = await getVisiblePostBySlug(props.entrySlug)
  if (!post) return null
  const headings = extractHeadings(post.builderData)
  return (
    <>
      <GazetteStyles />
      <TableOfContents headings={headings} />
    </>
  )
}

export const gazetteTableOfContentsPuckComponent = {
  label: 'Gazette: Table of Contents',
  fields: {},
  defaultProps: {},
  render: GazetteTableOfContentsBlock,
}

export const gazetteTableOfContentsPuckRscComponent = { ...gazetteTableOfContentsPuckComponent, render: GazetteTableOfContentsBlockRsc }
