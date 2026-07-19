// Editor half only. The database-backed render lives in ./GazettePostBodyBlock.rsc.
//
// This file reaches the Puck editor's client bundle through the generated
// module-components registry, so whatever it imports ends up in the browser. It
// must never reach prisma: lib/db/prisma attaches a client extension at module
// scope, which throws on load in a browser and takes the whole page builder
// down, not just this block.

// [ANCHOR] - entrySlug is injected by the post page (lib/inject-entry-context.ts).
// Nests a <Render> of the post's own body content, plus the post-content
// actions (reactions, share) that don't need their own independently
// repositionable region.
export type GazettePostBodyProps = { entrySlug?: string }

export function GazettePostBody() {
  return (
    <div style={{ opacity: 0.6, display: 'grid', gap: '0.75rem' }}>
      {[0, 1, 2, 3].map((i) => <div key={i} style={{ height: 16, width: `${90 - i * 10}%`, background: 'var(--color-border)', borderRadius: 4 }} />)}
    </div>
  )
}

export const gazettePostBodyPuckComponent = {
  label: 'Gazette: Post Body [Anchor]',
  fields: {},
  defaultProps: {},
  permissions: { delete: false, duplicate: false },
  render: GazettePostBody,
}
