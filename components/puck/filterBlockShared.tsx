// The parts the three listing filter blocks (series, author, tag) have in
// common: their Puck fields, their editor preview, and the chip-building render
// their RSC halves call once they've fetched their own options.
//
// This file reaches the Puck editor's client bundle through the generated
// module-components registry, so whatever it imports ends up in the browser. It
// must never reach prisma: lib/db/prisma attaches a client extension at module
// scope, which throws on load in a browser and takes the whole page builder
// down, not just this block.

import GazetteStyles from '@/modules/gazette/components/public/GazetteStyles'
import FilterChips, { type GazetteFilterChip } from '@/modules/gazette/components/public/FilterChips'
import { buildFilterHref, type GazetteFilterDimension, type GazetteFilterState } from '@/modules/gazette/lib/filter-links'

export type GazetteFilterOption = { key: string; label: string; count: number }

export type GazetteFilterBlockProps = {
  // Editor-set.
  title?: string
  variant?: string
  sortBy?: string
  limit?: number
  showCounts?: string
  showAll?: string
  allLabel?: string
  // Injected by the listing pages (lib/inject-category-context.ts) so a chip
  // knows what's already filtered.
  //
  // The injector Object.assigns the whole context over a block's props, so an
  // editor-set field here must never be named after a context key - `heading`,
  // `description`, `page`, `baseUrl`, `year` or `month` would all be silently
  // overwritten at render. Hence `title` above rather than `heading`.
  tagSlug?: string
  seriesSlug?: string
  authorUsername?: string
}

export function filterBlockFields() {
  return {
    title: { type: 'text' as const, label: 'Heading (blank to hide)' },
    variant: {
      type: 'select' as const, label: 'Style',
      options: [{ value: 'Pills', label: 'Pills' }, { value: 'List', label: 'List' }],
    },
    sortBy: {
      type: 'select' as const, label: 'Order',
      options: [{ value: 'Name', label: 'A to Z' }, { value: 'Count', label: 'Most posts first' }],
    },
    limit: { type: 'number' as const, label: 'Maximum shown (0 for all)' },
    showCounts: {
      type: 'select' as const, label: 'Show post counts',
      options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }],
    },
    showAll: {
      type: 'select' as const, label: 'Show the "all" option',
      options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }],
    },
    allLabel: { type: 'text' as const, label: '"All" label' },
  }
}

export function filterBlockDefaults(title: string, allLabel: string) {
  return { title, variant: 'Pills', sortBy: 'Name', limit: 0, showCounts: 'yes', showAll: 'yes', allLabel }
}

function filterState(props: GazetteFilterBlockProps): GazetteFilterState {
  return { series: props.seriesSlug, author: props.authorUsername, tag: props.tagSlug }
}

// Options arrive label-ascending from the database; re-sort and trim to taste.
// A trimmed list still keeps whatever is currently filtered on, otherwise
// picking the 30th tag would make its own chip vanish and leave nothing showing
// as selected.
function visibleOptions(options: GazetteFilterOption[], props: GazetteFilterBlockProps, active?: string): GazetteFilterOption[] {
  const sorted = props.sortBy === 'Count'
    ? [...options].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    : options
  const limit = Number(props.limit) || 0
  if (limit <= 0 || sorted.length <= limit) return sorted

  const trimmed = sorted.slice(0, limit)
  if (active && !trimmed.some((o) => o.key === active)) {
    const current = sorted.find((o) => o.key === active)
    if (current) trimmed.push(current)
  }
  return trimmed
}

function buildChips(
  props: GazetteFilterBlockProps,
  dimension: GazetteFilterDimension,
  options: GazetteFilterOption[],
  defaultAllLabel: string,
): GazetteFilterChip[] {
  const state = filterState(props)
  const active = state[dimension]
  const chips: GazetteFilterChip[] = []

  if (props.showAll !== 'no') {
    chips.push({
      key: '__all',
      label: props.allLabel || defaultAllLabel,
      href: buildFilterHref(state, dimension, null),
      active: !active,
    })
  }
  for (const option of visibleOptions(options, props, active)) {
    chips.push({
      key: option.key,
      label: option.label,
      count: option.count,
      href: buildFilterHref(state, dimension, option.key),
      active: active === option.key,
    })
  }
  return chips
}

export function FilterBlockRender({
  props, dimension, options, defaultAllLabel, ariaLabel, chips: given,
}: {
  props: GazetteFilterBlockProps
  dimension: GazetteFilterDimension
  options: GazetteFilterOption[]
  defaultAllLabel: string
  ariaLabel: string
  chips?: GazetteFilterChip[]
}) {
  // Nothing to filter by yet - render nothing at all rather than a heading over
  // an empty row, the same way the featured block bows out on an empty blog.
  if (options.length === 0) return null

  const chips = given ?? buildChips(props, dimension, options, defaultAllLabel)

  return (
    <>
      <GazetteStyles />
      <FilterChips
        title={props.title}
        ariaLabel={ariaLabel}
        items={chips}
        variant={props.variant === 'List' ? 'list' : 'pills'}
        showCounts={props.showCounts !== 'no'}
      />
    </>
  )
}

// Editor canvas: the real chip markup with stand-in labels, since the editor
// can't reach the database from the browser. Same classes as the live render,
// so the builder shows the actual styling of whichever options are picked.
export function FilterBlockEditorPreview({
  props, samples, defaultAllLabel, ariaLabel,
}: {
  props: GazetteFilterBlockProps
  samples: string[]
  defaultAllLabel: string
  ariaLabel: string
}) {
  const options: GazetteFilterOption[] = samples.map((label, i) => ({ key: `sample-${i}`, label, count: 3 - i }))
  const preview = { ...props, seriesSlug: undefined, authorUsername: undefined, tagSlug: undefined }
  // Dead hrefs on the canvas: a real one would sail the builder's preview frame
  // off to the live listing on a stray click.
  const chips = buildChips(preview, 'tag', options, defaultAllLabel).map((chip) => ({ ...chip, href: '#' }))

  return (
    <div style={{ opacity: 0.8 }}>
      <FilterBlockRender
        props={preview}
        dimension="tag"
        options={options}
        defaultAllLabel={defaultAllLabel}
        ariaLabel={ariaLabel}
        chips={chips}
      />
    </div>
  )
}
