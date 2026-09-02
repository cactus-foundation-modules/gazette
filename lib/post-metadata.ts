import type { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { getVisiblePostBySlug } from './db'
import { getPostUrlStyle, postUrl } from './post-url'
import { siteUrl } from './site-url'

// Shared by both addresses a post can be served at, so the canonical always
// points at wherever the site's URL style says the post actually lives - the
// one thing that keeps the old /gazette/<slug> address from competing with the
// new one in search results while the redirect beds in.
export async function buildPostMetadata(slug: string): Promise<Metadata> {
  const post = await getVisiblePostBySlug(slug)
  if (!post) return {}

  const [image, style] = await Promise.all([
    post.featuredImageId
      ? prisma.media.findUnique({ where: { id: post.featuredImageId }, select: { url: true } })
      : Promise.resolve(null),
    getPostUrlStyle(),
  ])

  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt ?? undefined,
    alternates: { canonical: post.canonicalUrl ?? postUrl(siteUrl(), post.slug, style) },
    openGraph: {
      type: 'article',
      // Social cards carry the post's own headline, not the keyword-first SEO
      // title: nothing is being matched against a query on a Facebook or
      // LinkedIn card, so the personality of the real title is what earns the
      // click. The <title> tag above stays on seoTitle.
      title: post.title || post.seoTitle || undefined,
      publishedTime: (post.publishedAt ?? post.scheduledFor ?? undefined)?.toISOString(),
      images: image?.url ? [{ url: image.url }] : undefined,
    },
    twitter: {
      title: post.title || post.seoTitle || undefined,
    },
  }
}
