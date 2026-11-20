import { gazetteProseFieldDef } from './GazetteProse'
import { gazettePullQuoteFieldDef } from './GazettePullQuote'
import { gazetteCodeFieldDef } from './GazetteCode'
import { gazetteImageFieldDef } from './GazetteImage'
import { gazetteDividerFieldDef } from './GazetteDivider'
import { gazetteVideoFieldDef } from './GazetteVideoEditor'

// Gazette-only Puck config for the post body - deliberately NOT the site-wide
// palette (these blocks aren't registered in the manifest). Kept small and
// writing-first: five prose-focused blocks plus core's Video block, one category, nothing else.
export const bodyEditorConfig = {
  categories: {
    postContent: {
      title: 'Post content',
      components: ['GazetteProse', 'GazettePullQuote', 'GazetteCode', 'GazetteImage', 'VideoEmbed', 'GazetteDivider'],
      defaultExpanded: true,
    },
  },
  components: {
    GazetteProse: gazetteProseFieldDef,
    GazettePullQuote: gazettePullQuoteFieldDef,
    GazetteCode: gazetteCodeFieldDef,
    GazetteImage: gazetteImageFieldDef,
    VideoEmbed: gazetteVideoFieldDef,
    GazetteDivider: gazetteDividerFieldDef,
  },
}

export type BodyEditorConfig = typeof bodyEditorConfig
