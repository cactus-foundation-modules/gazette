import { JSDOM } from 'jsdom'
import type { ParsedImportPost } from './types'

// Medium's "Export your data" zip contains posts/*.html files. Zips are out of
// scope for v1 (no zip dependency available to core) - the admin unzips and
// selects the extracted HTML files directly.
export function parseMediumHtmlFiles(files: Array<{ filename: string; content: string }>): ParsedImportPost[] {
  const posts: ParsedImportPost[] = []

  for (const file of files) {
    const dom = new JSDOM(file.content)
    const doc = dom.window.document

    const titleTag = doc.querySelector('title')?.textContent?.trim() ?? ''
    const firstH1 = doc.querySelector('h1')?.textContent?.trim() ?? ''
    const title = (firstH1 || titleTag.replace(/\s*\|\s*Medium\s*$/i, '')).trim()
    if (!title) continue

    const contentSection = doc.querySelector('section.e-content, section[data-field="body"]') ?? doc.querySelector('body')
    const bodyHtml = contentSection?.innerHTML ?? ''

    const timeEl = doc.querySelector('time')
    const dateAttr = timeEl?.getAttribute('datetime')
    const publishedAt = dateAttr ? new Date(dateAttr) : null

    posts.push({
      title,
      slug: null,
      excerpt: null,
      bodyHtml,
      tags: [],
      authorEmail: null,
      importedAuthorName: null,
      publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
    })
  }

  return posts
}
