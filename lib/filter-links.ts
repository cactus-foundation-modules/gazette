// Link maths for the listing filter blocks.
//
// Client-safe on purpose: both halves of every filter block import this - the
// editor one lands in the browser bundle - so nothing here may reach prisma or
// any server-only API.

export const GAZETTE_LISTING_BASE = '/gazette'

export type GazetteFilterDimension = 'series' | 'author' | 'tag'

// The listing's active filter, however it arrived. A /gazette/tag/<slug> style
// route pins one dimension; the ?series=&author=&tag= params on the index can
// pin all three at once. Both land in the same shape so a chip can build a link
// that changes its own dimension and keeps the other two.
export type GazetteFilterState = {
  series?: string
  author?: string // username, matching /gazette/author/<username>
  tag?: string
}

export function filterQueryString(state: GazetteFilterState): string {
  const params = new URLSearchParams()
  // Fixed order, so one set of filters is always one URL rather than six
  // permutations of the same page.
  if (state.series) params.set('series', state.series)
  if (state.author) params.set('author', state.author)
  if (state.tag) params.set('tag', state.tag)
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

// Filter chips always point at the index with query params rather than at the
// /gazette/tag/<slug> routes: those routes pin exactly one dimension, so
// linking to them would silently drop whatever else the visitor had picked.
// The canonical single-filter routes still work and still feed this state.
export function buildFilterHref(
  state: GazetteFilterState,
  dimension: GazetteFilterDimension,
  value: string | null,
): string {
  const next: GazetteFilterState = { ...state, [dimension]: value ?? undefined }
  return `${GAZETTE_LISTING_BASE}${filterQueryString(next)}`
}
