// [ANCHOR] - heading/description are injected by the listing pages
// (lib/inject-category-context.ts) since a shared "gazetteCategory" layout has
// no fixed heading of its own (index/tag/series/author/archive each differ).
export type GazetteCategoryHeaderProps = { heading?: string; description?: string | null }

export function GazetteCategoryHeader() {
  return (
    <div style={{ opacity: 0.6 }}>
      <div style={{ height: 32, width: '40%', background: 'var(--color-border)', borderRadius: 4, marginBottom: '0.5rem' }} />
      <div style={{ height: 18, width: '60%', background: 'var(--color-border)', borderRadius: 4 }} />
    </div>
  )
}

export function GazetteCategoryHeaderRsc(props: GazetteCategoryHeaderProps) {
  if (!props.heading) return null
  return (
    <div>
      <h1>{props.heading}</h1>
      {props.description && <p style={{ color: 'var(--color-text-muted)' }}>{props.description}</p>}
    </div>
  )
}

export const gazetteCategoryHeaderPuckComponent = {
  label: 'Gazette: Category Header [Anchor]',
  fields: {},
  defaultProps: {},
  permissions: { delete: false, duplicate: false },
  render: GazetteCategoryHeader,
}

export const gazetteCategoryHeaderPuckRscComponent = { ...gazetteCategoryHeaderPuckComponent, render: GazetteCategoryHeaderRsc }
