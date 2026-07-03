export type GazettePullQuoteProps = { quote?: string; attribution?: string }

export function GazettePullQuote({ quote, attribution }: GazettePullQuoteProps) {
  return (
    <figure className="gz-pullquote">
      <blockquote>{quote || 'Pull quote…'}</blockquote>
      {attribution && <figcaption>- {attribution}</figcaption>}
    </figure>
  )
}

export const gazettePullQuoteFieldDef = {
  label: 'Pull quote',
  fields: {
    quote: { type: 'textarea' as const, label: 'Quote' },
    attribution: { type: 'text' as const, label: 'Attribution (optional)' },
  },
  defaultProps: { quote: '', attribution: '' },
  render: GazettePullQuote,
}
