// Editor half only. The database-backed render lives in ./GazetteEntryHeaderBlock.rsc.
//
// This file reaches the Puck editor's client bundle through the generated
// module-components registry, so whatever it imports ends up in the browser. It
// must never reach prisma: lib/db/prisma attaches a client extension at module
// scope, which throws on load in a browser and takes the whole page builder
// down, not just this block.

// [ANCHOR] - entrySlug is injected by the post page (lib/inject-entry-context.ts)
export type GazetteEntryHeaderProps = { entrySlug?: string }

export function GazetteEntryHeader() {
  return (
    <div style={{ opacity: 0.6 }}>
      <div style={{ height: 200, background: 'var(--color-border)', borderRadius: 8, marginBottom: '1rem' }} />
      <div style={{ height: 32, width: '60%', background: 'var(--color-border)', borderRadius: 4 }} />
    </div>
  )
}

export const gazetteEntryHeaderPuckComponent = {
  label: 'Gazette: Entry Header [Anchor]',
  fields: {},
  defaultProps: {},
  permissions: { delete: false, duplicate: false },
  render: GazetteEntryHeader,
}
