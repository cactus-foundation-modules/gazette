import type { PuckData } from '@/modules/gazette/lib/types'

const CATEGORY_CONTEXT_BLOCKS = new Set(['GazetteCategoryHeader', 'GazetteEntryList'])

export type GazetteCategoryContext = {
  heading: string
  description?: string | null
  page: number
  baseUrl: string
  tagSlug?: string
  seriesSlug?: string
  authorId?: string
  year?: number
  month?: number
}

// The 'gazetteCategory' layout's blocks have no per-instance heading/filter of
// their own (it's one shared template rendered for the index, tag, series,
// author, and archive listing pages alike) - each listing page injects its
// own context into these block types' props right before rendering,
// mirroring Shop's injectProductContext (modules/shop/lib/inject-product-context.ts).
function injectBlocks(blocks: unknown[], ctx: GazetteCategoryContext): void {
  for (const item of blocks) {
    if (!item || typeof item !== 'object') continue
    const block = item as { type?: string; props?: Record<string, unknown> }
    if (block.type && CATEGORY_CONTEXT_BLOCKS.has(block.type) && block.props) {
      Object.assign(block.props, ctx)
    }
    if (block.props) {
      for (const value of Object.values(block.props)) {
        if (Array.isArray(value)) injectBlocks(value, ctx)
      }
    }
  }
}

export function injectCategoryContext(data: PuckData, ctx: GazetteCategoryContext): PuckData {
  const cloned = JSON.parse(JSON.stringify(data)) as PuckData
  const content = Array.isArray(cloned.content) ? cloned.content : []
  const zoneBlocks = Object.values(cloned.zones ?? {}).flatMap((z) => (Array.isArray(z) ? z : []))
  injectBlocks([...content, ...zoneBlocks], ctx)
  return cloned
}
