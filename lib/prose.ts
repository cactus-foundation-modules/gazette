import { generateHTML } from '@tiptap/html'
import type { JSONContent } from '@tiptap/core'
import { Document } from '@tiptap/extension-document'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Text } from '@tiptap/extension-text'
import { Bold } from '@tiptap/extension-bold'
import { Italic } from '@tiptap/extension-italic'
import { Heading } from '@tiptap/extension-heading'
import { Blockquote } from '@tiptap/extension-blockquote'
import { HardBreak } from '@tiptap/extension-hard-break'
import { Link } from '@tiptap/extension-link'
import { BulletList, OrderedList, ListItem } from '@tiptap/extension-list'
import { injectHeadingIds } from './toc'

// Extensions for the GazetteProse block's richtext field. Matches the field's
// declared `options` (Phase 5: code/codeBlock/strike/underline/horizontalRule/
// textAlign all disabled) so the editor schema and this conversion schema agree.
// No Image extension: @tiptap/extension-image isn't a transitive dependency of
// @puckeditor/core and modules can't add npm packages, so an imported <img> tag
// is silently dropped by generateJSON rather than embedded - acceptable, since
// imported images are handled separately (see lib/import/convert.ts).
export const proseExtensions = [
  Document, Paragraph, Text, Bold, Italic,
  Heading.configure({ levels: [2, 3, 4] }),
  Blockquote, HardBreak,
  // Same protocol list as core's RichText block (lib/puck/config.core.tsx). The
  // published render sanitises as well (see the *ProseRsc component) - this
  // only narrows what the editor lets in.
  Link.configure({ protocols: ['http', 'https', 'mailto', 'tel'] }),
  BulletList, OrderedList, ListItem,
]

// A GazetteProse block's `content` arrives in one of two shapes. Scripts, the
// importer and anything written before the admin editor touched it store a
// TipTap JSON document; Puck's richtext field saves an HTML string. The save
// path normalises strings back to JSON (see prose-normalise.ts), but posts
// stored before that, or written by something else, must still render - so
// every reader here accepts either.
export function renderProseHtml(content: unknown, headingIds?: string[]): string {
  if (!content) return ''
  let html = ''
  if (typeof content === 'string') {
    html = content
  } else {
    try {
      html = generateHTML(content as JSONContent, proseExtensions)
    } catch {
      return ''
    }
  }
  return headingIds ? injectHeadingIds(html, headingIds) : html
}

const NAMED_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (match, ref: string) => {
    if (ref[0] === '#') {
      const code = ref[1] === 'x' || ref[1] === 'X' ? parseInt(ref.slice(2), 16) : parseInt(ref.slice(1), 10)
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match
    }
    return NAMED_ENTITIES[ref.toLowerCase()] ?? match
  })
}

// Plain text of an HTML fragment: tags become word breaks, entities decode.
// Used for reading time and heading labels, never for markup.
export function htmlToText(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()
}

export function extractProseText(content: unknown): string {
  if (!content) return ''
  if (typeof content === 'string') return htmlToText(content)
  if (typeof content !== 'object') return ''
  const json = content as JSONContent
  let text = ''
  if (json.type === 'text' && typeof json.text === 'string') text += json.text
  if (Array.isArray(json.content)) {
    for (const child of json.content) text += (text ? ' ' : '') + extractProseText(child)
  }
  return text.trim()
}
