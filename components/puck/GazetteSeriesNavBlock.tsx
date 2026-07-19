// Editor half only. The database-backed render lives in ./GazetteSeriesNavBlock.rsc.
//
// This file reaches the Puck editor's client bundle through the generated
// module-components registry, so whatever it imports ends up in the browser. It
// must never reach prisma: lib/db/prisma attaches a client extension at module
// scope, which throws on load in a browser and takes the whole page builder
// down, not just this block.

// entrySlug is injected by the post page (lib/inject-entry-context.ts)
export type GazetteSeriesNavProps = { entrySlug?: string }

export function GazetteSeriesNavBlock() {
  return <div style={{ height: 60, background: 'var(--color-border)', borderRadius: 8, opacity: 0.6 }} />
}

export const gazetteSeriesNavPuckComponent = {
  label: 'Gazette: Series Navigation',
  fields: {},
  defaultProps: {},
  render: GazetteSeriesNavBlock,
}
