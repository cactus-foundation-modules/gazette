// Editor half only. The database-backed render lives in ./GazetteTableOfContentsBlock.rsc.
//
// This file reaches the Puck editor's client bundle through the generated
// module-components registry, so whatever it imports ends up in the browser. It
// must never reach prisma: lib/db/prisma attaches a client extension at module
// scope, which throws on load in a browser and takes the whole page builder
// down, not just this block.

// entrySlug is injected by the post page (lib/inject-entry-context.ts)
export type GazetteTableOfContentsProps = { entrySlug?: string }

export function GazetteTableOfContentsBlock() {
  return <div style={{ height: 120, width: '30%', background: 'var(--color-border)', borderRadius: 8, opacity: 0.6 }} />
}

export const gazetteTableOfContentsPuckComponent = {
  label: 'Gazette: Table of Contents',
  fields: {},
  defaultProps: {},
  render: GazetteTableOfContentsBlock,
}
