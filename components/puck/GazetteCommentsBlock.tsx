// entrySlug is injected by the post page (lib/inject-entry-context.ts)
export type GazetteCommentsProps = { entrySlug?: string }

export function GazetteCommentsBlock() {
  return <div style={{ height: 160, background: 'var(--color-border)', borderRadius: 8, opacity: 0.6 }} />
}

export const gazetteCommentsPuckComponent = {
  label: 'Gazette: Comments',
  fields: {},
  defaultProps: {},
  render: GazetteCommentsBlock,
}
