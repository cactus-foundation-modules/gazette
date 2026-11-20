import { VideoUrlPickerField } from '@/lib/puck/MediaPickerField'
import { gazetteVideoRscFieldDef } from './GazetteVideo'

// Editor: core's Video def with its "Video file" text field swapped for the
// media-library video picker - the same swap the page editor makes through
// withImagePickerFields. Only reached from bodyEditorConfig (the client editor).
export const gazetteVideoFieldDef = {
  ...gazetteVideoRscFieldDef,
  fields: {
    ...gazetteVideoRscFieldDef.fields,
    videoFile: { type: 'custom' as const, label: 'Video file', render: VideoUrlPickerField },
  },
}
