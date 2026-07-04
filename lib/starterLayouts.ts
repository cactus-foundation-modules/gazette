// Starter layout templates for the gazetteCategory/gazetteEntry layout types,
// collected by scripts/generate-module-layout-types.mjs (core) via this
// module's cactus.module.json layoutTypes.types[].starterImport/starterExport.
// Seeded as drafts only (see lib/setup/starterLayouts.ts) - the site owner
// opts in by publishing one.

const block = (type: string, id: string, props: Record<string, unknown> = {}) => ({ type, props: { id, ...props } })

const split = (id: string, ratio: string) => ({ type: 'Split', props: { id, ratio, align: 'stretch', gap: 'lg', padding: 'none' } })

const section = (id: string, overrides: Record<string, unknown> = {}) => ({
  type: 'Section',
  props: {
    id, bgType: 'none', bgColor: '', bgImage: '', bgSize: 'cover',
    overlayColor: '', overlayOpacity: 0, paddingY: 'md', maxWidth: 'standard',
    textColor: '', sticky: 'off', stickyOffset: '0px', boxShadow: 'none',
    borderStyle: 'none', borderColor: 'var(--color-border)', borderWidth: '1px',
    borderRadius: 'none', opacity: '100',
    animationType: 'none', animationDuration: 'normal', animationDelay: 'none',
    content: [],
    ...overrides,
  },
})

// ---------------------------------------------------------------------------
// Category templates (3) - featured feed is the "secondary" region here
// ---------------------------------------------------------------------------

export function gazetteCategoryStarters() {
  return [
    {
      id: 'starter-gazette-category-sidebar',
      name: 'Grid with Sidebar',
      description: 'Post list on the left (70%), featured posts on the right (30%).',
      data: {
        content: [
          block('GazetteCategoryHeader', 'header-1'),
          split('columns-1', '70/30'),
        ],
        root: { props: {} },
        zones: {
          'columns-1:left': [block('GazetteEntryList', 'list-1')],
          'columns-1:right': [block('GazetteFeatured', 'featured-1')],
        },
      },
    },
    {
      id: 'starter-gazette-category-banner',
      name: 'Full Width with Banner',
      description: 'Header, full-width featured banner, then a full-width post list below.',
      data: {
        content: [
          block('GazetteCategoryHeader', 'header-1'),
          block('GazetteFeatured', 'featured-1'),
          block('GazetteEntryList', 'list-1'),
        ],
        root: { props: {} },
        zones: {},
      },
    },
    {
      id: 'starter-gazette-category-compact',
      name: 'Compact List',
      description: 'Narrow boxed header, dense post list, no featured panel.',
      data: {
        content: [
          section('section-1', { maxWidth: 'narrow', content: [block('GazetteCategoryHeader', 'header-1')] }),
          block('GazetteEntryList', 'list-1'),
        ],
        root: { props: {} },
        zones: {},
      },
    },
  ]
}

// ---------------------------------------------------------------------------
// Entry templates (3)
// ---------------------------------------------------------------------------

export function gazetteEntryStarters() {
  return [
    {
      id: 'starter-gazette-entry-sidebar',
      name: 'Media-Forward with Sidebar',
      description: 'Post body (70%) with table of contents, author bio, and series nav in a sidebar (30%).',
      data: {
        content: [split('columns-1', '70/30')],
        root: { props: {} },
        zones: {
          'columns-1:left': [block('GazetteEntryHeader', 'header-1'), block('GazettePostBody', 'body-1')],
          'columns-1:right': [block('GazetteTableOfContentsBlock', 'toc-1'), block('GazetteSeriesNavBlock', 'series-1'), block('GazetteAuthorBioBlock', 'author-1')],
        },
      },
    },
    {
      id: 'starter-gazette-entry-hero',
      name: 'Full Width Hero then Details',
      description: 'Full-width header, boxed body, author bio and related posts stacked below.',
      data: {
        content: [
          block('GazetteEntryHeader', 'header-1'),
          section('section-1', { content: [block('GazettePostBody', 'body-1'), block('GazetteSeriesNavBlock', 'series-1'), block('GazetteAuthorBioBlock', 'author-1')] }),
          block('GazetteRelatedPostsBlock', 'related-1'),
          block('GazetteCommentsBlock', 'comments-1'),
        ],
        root: { props: {} },
        zones: {},
      },
    },
    {
      id: 'starter-gazette-entry-split',
      name: 'Two Column Split',
      description: 'Header and body on one side, table of contents and author bio on the other, comments full-width beneath.',
      data: {
        content: [
          block('GazetteEntryHeader', 'header-1'),
          split('columns-1', '60/40'),
          block('GazetteRelatedPostsBlock', 'related-1'),
          block('GazetteCommentsBlock', 'comments-1'),
        ],
        root: { props: {} },
        zones: {
          'columns-1:left': [block('GazettePostBody', 'body-1')],
          'columns-1:right': [block('GazetteTableOfContentsBlock', 'toc-1'), block('GazetteAuthorBioBlock', 'author-1')],
        },
      },
    },
  ]
}
