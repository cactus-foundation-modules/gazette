import { getGazetteSettings } from './settings'
import type { PostUrlStyle } from './types'

// Every link to a post goes through here, so the site's chosen URL style is
// decided in one place rather than string-concatenated in a dozen. Only the
// post itself moves: the listing, tags, series, archive, author pages and the
// feed all stay under /gazette regardless.
export function postHref(slug: string, style: PostUrlStyle): string {
  return style === 'ROOT' ? `/${slug}` : `/gazette/${slug}`
}

export async function getPostUrlStyle(): Promise<PostUrlStyle> {
  return (await getGazetteSettings()).postUrlStyle
}

// Absolute form, for canonicals, share links and the feed.
export function postUrl(siteUrl: string, slug: string, style: PostUrlStyle): string {
  return `${siteUrl}${postHref(slug, style)}`
}
