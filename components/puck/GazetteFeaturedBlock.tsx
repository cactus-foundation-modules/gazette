import { connection } from 'next/server'

// Editor half only. The database-backed render lives in ./GazetteFeaturedBlock.rsc.
//
// This file reaches the Puck editor's client bundle through the generated
// module-components registry, so whatever it imports ends up in the browser. It
// must never reach prisma: lib/db/prisma attaches a client extension at module
// scope, which throws on load in a browser and takes the whole page builder
// down, not just this block.

export type GazetteFeaturedBlockProps = { source?: string; layout?: string }

export function GazetteFeaturedBlock({ layout }: GazetteFeaturedBlockProps) {
  const tall = layout !== 'Minimal'
  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden', opacity: 0.6 }}>
      {tall && <div style={{ height: 220, background: 'var(--color-border)' }} />}
      <div style={{ padding: '1rem' }}>
        <div style={{ height: 20, width: '60%', background: 'var(--color-border)', borderRadius: 4 }} />
      </div>
    </div>
  )
}

// RSC: calls connection() so pages embedding this block render dynamically -
// otherwise a pinned/latest post promotion wouldn't surface on a cached page.

export const gazetteFeaturedPuckComponent = {
  label: 'Gazette Featured',
  fields: {
    source: { type: 'select' as const, label: 'Source', options: [{ value: 'Latest', label: 'Latest post' }, { value: 'Pinned', label: 'Pinned post' }] },
    layout: { type: 'select' as const, label: 'Layout', options: [{ value: 'Hero', label: 'Hero' }, { value: 'Card', label: 'Card' }, { value: 'Minimal', label: 'Minimal' }] },
  },
  defaultProps: { source: 'Latest', layout: 'Card' },
  render: GazetteFeaturedBlock,
}
