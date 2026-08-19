import type { Metadata } from 'next'
import PostPageView from '@/modules/gazette/components/public/PostPageView'
import { buildPostMetadata } from '@/modules/gazette/lib/post-metadata'

// Reached only through core's bare-slug route, via the publicRootSlug claim in
// cactus.module.json - which is why this sits outside app/public/gazette, where
// every page file is also mounted under /gazette/. Core has already asked
// gazetteClaimsRootSlug() before it gets here, so the site is on the ROOT URL
// style and a post with this slug exists.
type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return buildPostMetadata(slug)
}

export default async function GazetteRootPostPage({ params }: Props) {
  const { slug } = await params
  return <PostPageView slug={slug} />
}
