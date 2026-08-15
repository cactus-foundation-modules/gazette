// Editor half only. The database-backed render lives in ./GazetteEntryHeaderBlock.rsc.
//
// This file reaches the Puck editor's client bundle through the generated
// module-components registry, so whatever it imports ends up in the browser. It
// must never reach prisma: lib/db/prisma attaches a client extension at module
// scope, which throws on load in a browser and takes the whole page builder
// down, not just this block.

import type { CSSProperties } from 'react'

// [ANCHOR] - entrySlug is injected by the post page (lib/inject-entry-context.ts)
export type GazetteEntryHeaderProps = {
  entrySlug?: string
  showImage?: string
  imageRatio?: string
  imageRadius?: string
  align?: string
  showAuthor?: string
  showDate?: string
  dateFormat?: string
  showReadingTime?: string
  showComments?: string
  showViews?: string
  showTags?: string
  tagsLabel?: string
}

// Every toggle is a 'true'/'false' string defaulting to ON, because Puck does
// not apply defaultProps to data that was saved before a field existed: the
// live post layouts hold `props: { id: 'header-1' }` and nothing else, so
// `undefined` has to mean "carry on exactly as before this block had options".
export const showsPart = (value?: string) => value !== 'false'

export const ENTRY_HEADER_RADIUS: Record<string, number> = { none: 0, sm: 4, md: 8, lg: 16 }
export const ENTRY_HEADER_RATIO: Record<string, string> = {
  '16-9': '16 / 9',
  '3-2': '3 / 2',
  '4-3': '4 / 3',
  '1-1': '1 / 1',
}

// The image is the post's own featured image, so it has whatever proportions it
// was uploaded with. 'auto' keeps them; every other option crops to a fixed
// shape so a column of posts headed by portrait and landscape photos still
// starts at the same place.
export function entryHeaderImageStyle(props: GazetteEntryHeaderProps): CSSProperties {
  const ratio = ENTRY_HEADER_RATIO[props.imageRatio ?? 'auto']
  return {
    width: '100%',
    borderRadius: ENTRY_HEADER_RADIUS[props.imageRadius ?? 'md'] ?? 8,
    marginBottom: '1.5rem',
    ...(ratio ? { aspectRatio: ratio, objectFit: 'cover' as const } : null),
  }
}

const YES_NO = [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]

export function GazetteEntryHeader(props: GazetteEntryHeaderProps) {
  const centred = props.align === 'center'
  const ratio = ENTRY_HEADER_RATIO[props.imageRatio ?? 'auto']
  const metaCount = [props.showAuthor, props.showDate, props.showReadingTime].filter(showsPart).length

  return (
    <div style={{ opacity: 0.6, textAlign: centred ? 'center' : 'left' }}>
      {showsPart(props.showImage) && (
        <div
          style={{
            height: ratio ? undefined : 200,
            aspectRatio: ratio,
            background: 'var(--color-border)',
            borderRadius: ENTRY_HEADER_RADIUS[props.imageRadius ?? 'md'] ?? 8,
            marginBottom: '1rem',
          }}
        />
      )}
      <div style={{ height: 32, width: '60%', background: 'var(--color-border)', borderRadius: 4, margin: centred ? '0 auto' : undefined }} />
      {metaCount > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', justifyContent: centred ? 'center' : 'flex-start' }}>
          {Array.from({ length: metaCount }, (_, i) => (
            <div key={i} style={{ height: 12, width: 64, background: 'var(--color-border)', borderRadius: 4 }} />
          ))}
        </div>
      )}
    </div>
  )
}

export const gazetteEntryHeaderPuckComponent = {
  label: 'Gazette: Entry Header [Anchor]',
  fields: {
    showImage: { type: 'select' as const, label: 'Featured image', options: YES_NO },
    imageRatio: {
      type: 'select' as const,
      label: 'Image shape',
      options: [
        { value: 'auto', label: 'As uploaded' },
        { value: '16-9', label: 'Widescreen (16:9)' },
        { value: '3-2', label: 'Landscape (3:2)' },
        { value: '4-3', label: 'Classic (4:3)' },
        { value: '1-1', label: 'Square' },
      ],
    },
    imageRadius: {
      type: 'select' as const,
      label: 'Image corners',
      options: [
        { value: 'none', label: 'Square corners' },
        { value: 'sm', label: 'Slightly rounded' },
        { value: 'md', label: 'Rounded' },
        { value: 'lg', label: 'Very rounded' },
      ],
    },
    align: { type: 'select' as const, label: 'Alignment', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centred' }] },
    showAuthor: { type: 'select' as const, label: 'Author name', options: YES_NO },
    showDate: { type: 'select' as const, label: 'Date', options: YES_NO },
    dateFormat: {
      type: 'select' as const,
      label: 'Date style',
      options: [
        { value: 'long', label: '14 August 2026' },
        { value: 'short', label: '14 Aug 2026' },
        { value: 'numeric', label: '14/08/2026' },
      ],
    },
    showReadingTime: { type: 'select' as const, label: 'Reading time', options: YES_NO },
    showComments: { type: 'select' as const, label: 'Comment count', options: YES_NO },
    showViews: { type: 'select' as const, label: 'View count', options: YES_NO },
    showTags: { type: 'select' as const, label: 'Tags', options: YES_NO },
    tagsLabel: { type: 'text' as const, label: 'Tags label (blank for none)' },
  },
  defaultProps: {
    showImage: 'true',
    imageRatio: 'auto',
    imageRadius: 'md',
    align: 'left',
    showAuthor: 'true',
    showDate: 'true',
    dateFormat: 'long',
    showReadingTime: 'true',
    showComments: 'true',
    showViews: 'true',
    showTags: 'true',
    tagsLabel: 'Tagged:',
  },
  // Only ever show settings that can do something: the image's shape and
  // corners with the image switched off, or a date style with no date, are
  // three knobs that silently change nothing.
  resolveFields: (data: { props?: GazetteEntryHeaderProps }, { fields }: { fields: Record<string, unknown> }) => {
    const rest = { ...fields }
    if (!showsPart(data.props?.showImage)) { delete rest.imageRatio; delete rest.imageRadius }
    if (!showsPart(data.props?.showDate)) delete rest.dateFormat
    if (!showsPart(data.props?.showTags)) delete rest.tagsLabel
    return rest
  },
  permissions: { delete: false, duplicate: false },
  render: GazetteEntryHeader,
}
