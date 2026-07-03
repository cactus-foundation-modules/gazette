import type { JSONContent } from '@tiptap/core'
import type { PuckData } from './types'
import { extractProseText } from './prose'

export type TocHeading = { id: string; text: string; level: number; blockId: string }

export function slugifyHeading(text: string, usedIds: Set<string>): string {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'heading'

  let id = base
  let suffix = 2
  while (usedIds.has(id)) {
    id = `${base}-${suffix}`
    suffix += 1
  }
  usedIds.add(id)
  return id
}

function walkHeadings(node: JSONContent, level2and3Only: boolean): Array<{ text: string; level: number }> {
  const out: Array<{ text: string; level: number }> = []
  if (node.type === 'heading') {
    const level = (node.attrs?.level as number) ?? 2
    if (!level2and3Only || level === 2 || level === 3) {
      out.push({ text: extractProseText(node), level })
    }
  }
  if (Array.isArray(node.content)) {
    for (const child of node.content) out.push(...walkHeadings(child, level2and3Only))
  }
  return out
}

// Walks every GazetteProse block in document order and assigns deterministic,
// deduplicated ids to its H2/H3 headings - the ids a page-level TableOfContents
// links to, and the same ids injected into each block's rendered HTML.
export function extractHeadings(builderData: PuckData | null): TocHeading[] {
  if (!builderData?.content) return []
  const usedIds = new Set<string>()
  const headings: TocHeading[] = []

  for (const block of builderData.content) {
    if (block?.type !== 'GazetteProse') continue
    const content = block.props?.content as JSONContent | undefined
    if (!content) continue
    const blockId = (block.props?.id as string) ?? ''
    for (const h of walkHeadings(content, true)) {
      headings.push({ id: slugifyHeading(h.text, usedIds), text: h.text, level: h.level, blockId })
    }
  }
  return headings
}

export function getHeadingIdsForBlock(headings: TocHeading[], blockId: string): string[] {
  return headings.filter((h) => h.blockId === blockId).map((h) => h.id)
}

// Replaces <h2>/<h3> opening tags in `html`, in order, with id-bearing versions -
// ids are assigned in the same document order as extractHeadings walks, so a
// sequential swap is exact. <h4> is left untouched (headings, not TOC entries).
export function injectHeadingIds(html: string, ids: string[]): string {
  let i = 0
  return html.replace(/<(h2|h3)(\s[^>]*)?>/g, (match, tag: string, attrs = '') => {
    if (i >= ids.length) return match
    const id = ids[i]
    i += 1
    if (/\sid=/.test(attrs)) return match
    return `<${tag} id="${id}"${attrs}>`
  })
}
