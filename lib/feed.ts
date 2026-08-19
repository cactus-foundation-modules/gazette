import { postUrl } from './post-url'
import type { GazettePostListItem, GazetteSettings } from './types'

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function buildRssXml(opts: {
  siteUrl: string
  siteName: string
  settings: GazetteSettings
  posts: Array<GazettePostListItem & { authorName: string | null; effectiveDate: Date }>
}): string {
  const { siteUrl, siteName, settings, posts } = opts
  const channelTitle = settings.feedTitle ?? `${siteName} Gazette`
  const channelDescription = settings.feedDescription ?? ''
  const selfUrl = `${siteUrl}/gazette/feed.xml`

  const items = posts.map((p) => {
    const link = postUrl(siteUrl, p.slug, settings.postUrlStyle)
    return `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${p.effectiveDate.toUTCString()}</pubDate>
      ${p.authorName ? `<dc:creator>${escapeXml(p.authorName)}</dc:creator>` : ''}
      <description>${escapeXml(p.excerpt ?? '')}</description>
    </item>`
  }).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${escapeXml(`${siteUrl}/gazette`)}</link>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml" />
    <description>${escapeXml(channelDescription)}</description>${items}
  </channel>
</rss>`
}
