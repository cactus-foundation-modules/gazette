import type { PuckData } from '@/modules/gazette/lib/types'

const ENTRY_CONTEXT_BLOCKS = new Set([
  'GazetteEntryHeader', 'GazettePostBody', 'GazetteAuthorBioBlock', 'GazetteSeriesNavBlock',
  'GazetteRelatedPostsBlock', 'GazetteTableOfContentsBlock', 'GazetteCommentsBlock',
])

export type GazetteEntryContext = { entrySlug: string }

// The 'gazetteEntry' layout's blocks have no per-instance post slug of their
// own (it's one shared template rendered for every post) - the post page
// injects the current post's slug into each of these block types' props
// right before rendering, mirroring Shop's injectProductContext
// (modules/shop/lib/inject-product-context.ts).
function injectBlocks(blocks: unknown[], ctx: GazetteEntryContext): void {
  for (const item of blocks) {
    if (!item || typeof item !== 'object') continue
    const block = item as { type?: string; props?: Record<string, unknown> }
    if (block.type && ENTRY_CONTEXT_BLOCKS.has(block.type) && block.props) {
      block.props.entrySlug = ctx.entrySlug
    }
    if (block.props) {
      for (const value of Object.values(block.props)) {
        if (Array.isArray(value)) injectBlocks(value, ctx)
      }
    }
  }
}

export function injectEntryContext(data: PuckData, ctx: GazetteEntryContext): PuckData {
  const cloned = JSON.parse(JSON.stringify(data)) as PuckData
  const content = Array.isArray(cloned.content) ? cloned.content : []
  const zoneBlocks = Object.values(cloned.zones ?? {}).flatMap((z) => (Array.isArray(z) ? z : []))
  injectBlocks([...content, ...zoneBlocks], ctx)
  return cloned
}
