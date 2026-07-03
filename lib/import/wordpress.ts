import { JSDOM } from 'jsdom'
import type { ParsedImportPost } from './types'

function text(el: Element | null | undefined): string {
  return el?.textContent?.trim() ?? ''
}

export function parseWordPressXml(xml: string): ParsedImportPost[] {
  const dom = new JSDOM(xml, { contentType: 'text/xml' })
  const doc = dom.window.document

  // wp:author blocks map author_login -> author_email, used to resolve dc:creator.
  const emailByLogin = new Map<string, string>()
  for (const authorEl of Array.from(doc.querySelectorAll('channel > wp\\:author'))) {
    const login = text(authorEl.querySelector('wp\\:author_login'))
    const email = text(authorEl.querySelector('wp\\:author_email'))
    if (login && email) emailByLogin.set(login, email)
  }

  const items = Array.from(doc.querySelectorAll('channel > item'))
  const posts: ParsedImportPost[] = []

  for (const item of items) {
    const postType = text(item.querySelector('wp\\:post_type'))
    if (postType !== 'post') continue

    const title = text(item.querySelector('title'))
    if (!title) continue

    const bodyHtml = text(item.querySelector('content\\:encoded'))
    const excerpt = text(item.querySelector('excerpt\\:encoded')) || null
    const creatorLogin = text(item.querySelector('dc\\:creator'))
    const authorEmail = creatorLogin ? emailByLogin.get(creatorLogin) ?? null : null

    const tags = Array.from(item.querySelectorAll('category'))
      .filter((cat) => cat.getAttribute('domain') === 'post_tag')
      .map((cat) => cat.textContent?.trim())
      .filter((t): t is string => !!t)

    const pubDateRaw = text(item.querySelector('wp\\:post_date')) || text(item.querySelector('pubDate'))
    const publishedAt = pubDateRaw ? new Date(pubDateRaw) : null

    posts.push({
      title,
      slug: null,
      excerpt,
      bodyHtml,
      tags,
      authorEmail,
      importedAuthorName: authorEmail ? null : (creatorLogin || null),
      publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
    })
  }

  return posts
}
