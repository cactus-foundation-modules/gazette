import { generateJSON } from '@tiptap/html'
import { proseExtensions } from './prose'
import type { PuckData } from './types'

// Puck's richtext field saves a GazetteProse block's content as an HTML string,
// while the importer, scripts and older posts store TipTap JSON. The readers in
// prose.ts/toc.ts accept both, but storing one shape keeps anything else that
// reads builder_data (exports, scripts, other sites' tooling) from having to
// know about two. So every write converts strings to JSON through the same
// extension set the renderer uses - what the editor's schema allows, nothing
// more. The editor loads JSON happily (TipTap's setContent takes either), so
// the round trip is invisible to the owner.
function normaliseNode(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(normaliseNode)
  if (!node || typeof node !== 'object') return node
  const obj = node as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) out[key] = normaliseNode(value)
  if (obj.type === 'GazetteProse' && out.props && typeof out.props === 'object') {
    const props = out.props as Record<string, unknown>
    if (typeof props.content === 'string') {
      out.props = { ...props, content: props.content.trim() ? generateJSON(props.content, proseExtensions) : undefined }
    }
  }
  return out
}

// Walks content, zones and any slot arrays inside props, so a prose block
// nested in a layout block is caught too.
export function normaliseProseContent(data: PuckData): PuckData {
  return normaliseNode(data) as PuckData
}
