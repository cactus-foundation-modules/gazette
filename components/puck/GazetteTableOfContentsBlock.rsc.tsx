import { connection } from 'next/server'
import { getVisiblePostBySlug } from '@/modules/gazette/lib/db'
import { extractHeadings } from '@/modules/gazette/lib/toc'
import { getGazetteBreakpoints } from '@/modules/gazette/lib/breakpoints'
import TableOfContents from '@/modules/gazette/components/public/TableOfContents'
import GazetteStyles from '@/modules/gazette/components/public/GazetteStyles'
import { gazetteTableOfContentsPuckComponent, type GazetteTableOfContentsProps } from './GazetteTableOfContentsBlock'

export async function GazetteTableOfContentsBlockRsc(props: GazetteTableOfContentsProps) {
  await connection()
  if (!props.entrySlug) return null
  const post = await getVisiblePostBySlug(props.entrySlug)
  if (!post) return null
  const headings = extractHeadings(post.builderData)
  // The desktop (sticky sidebar) vs mobile (collapsed <details>) switch tracks
  // the site's tablet breakpoint from Styles rather than a hardcoded width.
  const { tabletBp } = await getGazetteBreakpoints()
  return (
    <>
      <GazetteStyles />
      <TableOfContents headings={headings} desktopBreakpoint={tabletBp} />
    </>
  )
}
export const gazetteTableOfContentsPuckRscComponent = { ...gazetteTableOfContentsPuckComponent, render: GazetteTableOfContentsBlockRsc }
