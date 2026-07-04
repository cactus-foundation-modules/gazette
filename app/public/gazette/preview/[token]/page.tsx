import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPostByPreviewHash } from '@/modules/gazette/lib/db'
import { hashPreviewToken } from '@/modules/gazette/lib/preview'
import GazetteStyles from '@/modules/gazette/components/public/GazetteStyles'
import PostBody from '@/modules/gazette/components/public/PostBody'
import TableOfContents from '@/modules/gazette/components/public/TableOfContents'
import { extractHeadings } from '@/modules/gazette/lib/toc'
import { getGazetteBreakpoints } from '@/modules/gazette/lib/breakpoints'
import { readingTimeMinutes } from '@/modules/gazette/lib/reading-time'

type Props = { params: Promise<{ token: string }> }

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false, follow: false } }
}

export default async function GazettePreviewPage({ params }: Props) {
  const { token } = await params
  const post = await getPostByPreviewHash(hashPreviewToken(token))
  if (!post) notFound()

  const headings = extractHeadings(post.builderData)
  const readingTime = readingTimeMinutes(post.builderData)
  const { tabletBp } = await getGazetteBreakpoints()

  return (
    <div className="gz-container">
      <GazetteStyles />
      <div style={{ margin: '0 0 1.5rem', borderRadius: 6, padding: '0.75rem 1.5rem', textAlign: 'center', background: 'var(--color-warning-bg)', color: 'var(--color-warning)', fontSize: '0.875rem', fontWeight: 500 }}>
        Draft preview - not visible to the public
      </div>
      <h1>{post.title}</h1>
      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{readingTime} min read</div>
      <TableOfContents headings={headings} desktopBreakpoint={tabletBp} />
      <PostBody builderData={post.builderData} />
    </div>
  )
}
