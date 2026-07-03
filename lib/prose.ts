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
  Blockquote, HardBreak, Link,
  BulletList, OrderedList, ListItem,
]

export function renderProseHtml(json: JSONContent, headingIds?: string[]): string {
  if (!json) return ''
  let html = ''
  try {
    html = generateHTML(json, proseExtensions)
  } catch {
    return ''
  }
  return headingIds ? injectHeadingIds(html, headingIds) : html
}

export function extractProseText(json: JSONContent | null | undefined): string {
  if (!json) return ''
  let text = ''
  if (json.type === 'text' && typeof json.text === 'string') text += json.text
  if (Array.isArray(json.content)) {
    for (const child of json.content) text += (text ? ' ' : '') + extractProseText(child)
  }
  return text.trim()
}
