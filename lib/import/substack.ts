import type { ParsedImportPost } from './types'

// Minimal RFC4180 CSV line splitter (no CSV dependency available to modules).
function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (ch === '"') { inQuotes = false }
      else { cur += ch }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      fields.push(cur); cur = ''
    } else {
      cur += ch
    }
  }
  fields.push(cur)
  return fields
}

function parseCsv(content: string): Array<Record<string, string>> {
  const lines = content.split(/\r\n|\n/).filter((l) => l.length > 0)
  if (lines.length === 0) return []
  const headers = parseCsvLine(lines[0]!).map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
}

// posts.csv (Substack's post export) plus optional posts/*.html files matched by
// a {post_id} filename prefix. Rows with no matching HTML import with just the
// excerpt/subtitle as body and are flagged in the dry-run preview.
export function parseSubstackCsv(
  csvContent: string,
  htmlFilesByPostId: Map<string, string>
): Array<ParsedImportPost & { htmlMatched: boolean }> {
  const rows = parseCsv(csvContent)
  const posts: Array<ParsedImportPost & { htmlMatched: boolean }> = []

  for (const row of rows) {
    const postId = row.post_id ?? row.id ?? ''
    const title = row.title?.trim()
    if (!title) continue

    const html = htmlFilesByPostId.get(postId)
    const subtitle = row.subtitle?.trim() ?? ''
    const dateRaw = row.post_date ?? row.created ?? ''
    const publishedAt = dateRaw ? new Date(dateRaw) : null

    posts.push({
      title,
      slug: null,
      excerpt: subtitle || null,
      bodyHtml: html ?? (subtitle ? `<p>${subtitle}</p>` : ''),
      tags: [],
      authorEmail: null,
      importedAuthorName: null,
      publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
      htmlMatched: !!html,
    })
  }

  return posts
}
