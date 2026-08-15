// Editor half only. The database-backed render lives in ./GazetteEntryListBlock.rsc.
//
// This file reaches the Puck editor's client bundle through the generated
// module-components registry, so whatever it imports ends up in the browser. It
// must never reach prisma: lib/db/prisma attaches a client extension at module
// scope, which throws on load in a browser and takes the whole page builder
// down, not just this block.

// [ANCHOR] - the listing pages inject mode/page/baseUrl and whichever filter is
// on (lib/inject-category-context.ts), because one shared layout serves the
// index, tag, series, author and archive listings. Everything below `page` is
// set here in the page builder.
//
// Careful with field names: the injector Object.assigns the whole context over
// these props, so a field called `heading`, `description`, `page`, `baseUrl`,
// `year` or `month` would be silently overwritten at render time.
export type GazetteEntryListProps = {
  page?: number
  baseUrl?: string
  tagSlug?: string
  seriesSlug?: string
  authorUsername?: string
  authorId?: string
  year?: number
  month?: number
  perPage?: number
  paging?: string
  sortBy?: string
  columns?: string
  showImage?: string
  imageRatio?: string
  cardHover?: string
  showExcerpt?: string
  showAuthor?: string
  showDate?: string
  showComments?: string
  showViews?: string
  loadMoreLabel?: string
}

const YES_NO = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]

// The shapes the cards' pictures can be cropped to. '16-9' is what every card
// was before this was a choice, so it stays the fallback for saved layouts that
// have no `imageRatio` of their own; the rules themselves live in
// GazetteStyles (.gz-post-grid[data-ratio]).
export const ENTRY_LIST_RATIOS: Record<string, string> = {
  '16-9': '16 / 9',
  '3-2': '3 / 2',
  '4-3': '4 / 3',
  '1-1': '1 / 1',
}

// Both attributes are left off the grid for the values that are already the
// stylesheet's own behaviour, so a listing saved before either field existed
// renders exactly the markup it always did.
export const entryListRatio = (value?: string) => (value && value !== '16-9' ? value : undefined)
export const entryListHover = (value?: string) => (value && value !== 'none' ? value : undefined)

// Editor canvas: a skeleton, since the browser can't reach the database. It
// still follows the column count and the paging choice, so the builder shows
// the shape of what will land.
export function GazetteEntryList(props: GazetteEntryListProps) {
  const columns = props.columns && props.columns !== 'Auto' ? Math.max(1, Math.min(4, Number(props.columns) || 3)) : 3
  const paging = props.paging ?? 'Pages'
  const boxes = Array.from({ length: columns * 2 })
  // The picture's share of the card is the one thing the shape option changes
  // on the canvas: the rest of a card is text of whatever length the posts run
  // to, which the skeleton can't know. "As uploaded" has no one shape to draw,
  // so it gets a middling one rather than no picture at all.
  const ratio = props.showImage === 'no' ? undefined : (ENTRY_LIST_RATIOS[props.imageRatio ?? '16-9'] ?? '3 / 2')

  return (
    <div style={{ opacity: 0.6 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '1rem' }}>
        {boxes.map((_, i) => (
          <div key={i} style={{ background: 'var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
            {ratio && <div style={{ aspectRatio: ratio, background: 'var(--color-bg-subtle)' }} />}
            <div style={{ height: ratio ? 96 : 220 }} />
          </div>
        ))}
      </div>
      {paging !== 'None' && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
          <div style={{ height: 34, width: paging === 'Pages' ? 220 : 150, background: 'var(--color-border)', borderRadius: 999 }} />
        </div>
      )}
    </div>
  )
}

export const gazetteEntryListPuckComponent = {
  label: 'Gazette: Entry List [Anchor]',
  fields: {
    perPage: { type: 'number' as const, label: 'Posts per page (0 for the Gazette setting)' },
    paging: {
      type: 'select' as const, label: 'When there are more posts',
      options: [
        { value: 'Pages', label: 'Numbered pages' },
        { value: 'Load more', label: '"Load more" button' },
        { value: 'Infinite scroll', label: 'Load as you scroll' },
        { value: 'None', label: 'Show nothing more' },
      ],
    },
    loadMoreLabel: { type: 'text' as const, label: '"Load more" label' },
    sortBy: {
      type: 'select' as const, label: 'Order',
      options: [
        { value: 'Newest', label: 'Newest first' },
        { value: 'Oldest', label: 'Oldest first' },
        { value: 'Most viewed', label: 'Most read first' },
        { value: 'A to Z', label: 'Title, A to Z' },
      ],
    },
    columns: {
      type: 'select' as const, label: 'Columns',
      options: [
        { value: 'Auto', label: 'Fit to the space' },
        { value: '1', label: 'One' },
        { value: '2', label: 'Two' },
        { value: '3', label: 'Three' },
        { value: '4', label: 'Four' },
      ],
    },
    showImage: { type: 'select' as const, label: 'Show image', options: YES_NO },
    imageRatio: {
      type: 'select' as const, label: 'Image shape',
      options: [
        { value: '16-9', label: 'Widescreen (16:9)' },
        { value: '3-2', label: 'Landscape (3:2)' },
        { value: '4-3', label: 'Classic (4:3)' },
        { value: '1-1', label: 'Square' },
        { value: 'auto', label: 'As uploaded' },
      ],
    },
    cardHover: {
      type: 'select' as const, label: 'When a card is hovered',
      options: [
        { value: 'none', label: 'Nothing' },
        { value: 'lift', label: 'Lift, with the picture easing in' },
        { value: 'grow', label: 'Grow slightly' },
      ],
    },
    showExcerpt: { type: 'select' as const, label: 'Show excerpt', options: YES_NO },
    showAuthor: { type: 'select' as const, label: 'Show author', options: YES_NO },
    showDate: { type: 'select' as const, label: 'Show date', options: YES_NO },
    showComments: { type: 'select' as const, label: 'Show comment count', options: YES_NO },
    showViews: {
      type: 'select' as const, label: 'Show view count',
      options: [{ value: 'auto', label: 'Follow the Gazette setting' }, ...YES_NO],
    },
  },
  defaultProps: {
    perPage: 0, paging: 'Pages', loadMoreLabel: 'Load more posts', sortBy: 'Newest', columns: 'Auto',
    showImage: 'yes', imageRatio: '16-9', cardHover: 'lift',
    showExcerpt: 'yes', showAuthor: 'yes', showDate: 'yes', showComments: 'yes', showViews: 'auto',
  },
  // A shape for a picture that isn't shown, and a "load more" label with no
  // button to put it on, are settings that quietly do nothing. Infinite scroll
  // keeps its label - it renders the button too, for keyboards and for when
  // there's no IntersectionObserver about.
  resolveFields: (data: { props?: GazetteEntryListProps }, { fields }: { fields: Record<string, unknown> }) => {
    const rest = { ...fields }
    if (data.props?.showImage === 'no') delete rest.imageRatio
    const paging = data.props?.paging ?? 'Pages'
    if (paging !== 'Load more' && paging !== 'Infinite scroll') delete rest.loadMoreLabel
    return rest
  },
  permissions: { delete: false, duplicate: false },
  render: GazetteEntryList,
}
