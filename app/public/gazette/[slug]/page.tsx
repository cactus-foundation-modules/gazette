import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'
import { getVisiblePostBySlug } from '@/modules/gazette/lib/db'
import { getPostUrlStyle, postHref } from '@/modules/gazette/lib/post-url'
import PostPageView from '@/modules/gazette/components/public/PostPageView'
import { buildPostMetadata } from '@/modules/gazette/lib/post-metadata'

type Props = { params: Promise<{ slug: string }> }

// On the ROOT URL style this address is the old one: every post that was ever
// shared, indexed or linked from another post still arrives here, so it sends
// visitors and crawlers on rather than 404ing. Checked against a real post
// first, so /gazette/<nonsense> still 404s instead of bouncing to /<nonsense>.
async function redirectTargetFor(slug: string): Promise<string | null> {
  if ((await getPostUrlStyle()) !== 'ROOT') return null
  const post = await getVisiblePostBySlug(slug)
  return post ? postHref(post.slug, 'ROOT') : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return buildPostMetadata(slug)
}

export default async function GazettePostPage({ params }: Props) {
  const { slug } = await params

  const target = await redirectTargetFor(slug)
  if (target) permanentRedirect(target)

  return <PostPageView slug={slug} />
}
