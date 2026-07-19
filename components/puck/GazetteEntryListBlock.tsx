// Editor half only. The database-backed render lives in ./GazetteEntryListBlock.rsc.
//
// This file reaches the Puck editor's client bundle through the generated
// module-components registry, so whatever it imports ends up in the browser. It
// must never reach prisma: lib/db/prisma attaches a client extension at module
// scope, which throws on load in a browser and takes the whole page builder
// down, not just this block.

// [ANCHOR] - mode/page/baseUrl/filter values are all injected by the listing
// pages (lib/inject-category-context.ts) - this block has no configurable
// Puck fields of its own, mirroring Shop's anchor blocks.
export type GazetteEntryListProps = {
  page?: number
  baseUrl?: string
  tagSlug?: string
  seriesSlug?: string
  authorId?: string
  year?: number
  month?: number
}

export function GazetteEntryList() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', opacity: 0.6 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ height: 220, background: 'var(--color-border)', borderRadius: 8 }} />
      ))}
    </div>
  )
}

export const gazetteEntryListPuckComponent = {
  label: 'Gazette: Entry List [Anchor]',
  fields: {},
  defaultProps: {},
  permissions: { delete: false, duplicate: false },
  render: GazetteEntryList,
}
