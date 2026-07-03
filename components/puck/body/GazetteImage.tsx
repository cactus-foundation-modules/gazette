import { ImageUrlPickerField } from '@/lib/puck/MediaPickerField'

export type GazetteImageProps = { mediaUrl?: string; alt?: string; caption?: string }

export function GazetteImage({ mediaUrl, alt, caption }: GazetteImageProps) {
  if (!mediaUrl) {
    return <div className="gz-image-placeholder">Choose an image in the panel</div>
  }
  return (
    <figure className="gz-image">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mediaUrl} alt={alt ?? ''} />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}

export const gazetteImageFieldDef = {
  label: 'Image',
  fields: {
    mediaUrl: { type: 'custom' as const, label: 'Image', render: ImageUrlPickerField },
    alt: { type: 'text' as const, label: 'Alt text' },
    caption: { type: 'text' as const, label: 'Caption' },
  },
  defaultProps: { mediaUrl: '', alt: '', caption: '' },
  render: GazetteImage,
}

// RSC variant: the media picker is an editor-only affordance (opens a modal that
// fetches /api/admin/media) - swap to a plain text field so it isn't pulled into
// the public render config at all.
export const gazetteImageRscFieldDef = {
  ...gazetteImageFieldDef,
  fields: { ...gazetteImageFieldDef.fields, mediaUrl: { type: 'text' as const, label: 'Image URL' } },
}
