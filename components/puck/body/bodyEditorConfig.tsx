import { gazetteProseFieldDef } from './GazetteProse'
import { gazettePullQuoteFieldDef } from './GazettePullQuote'
import { gazetteCodeFieldDef } from './GazetteCode'
import { gazetteImageFieldDef } from './GazetteImage'
import { gazetteDividerFieldDef } from './GazetteDivider'

// Gazette-only Puck config for the post body - deliberately NOT the site-wide
// palette (these blocks aren't registered in the manifest). Kept small and
// writing-first: five prose-focused blocks, one category, nothing else.
export const bodyEditorConfig = {
  categories: {
    postContent: {
      title: 'Post content',
      components: ['GazetteProse', 'GazettePullQuote', 'GazetteCode', 'GazetteImage', 'GazetteDivider'],
      defaultExpanded: true,
    },
  },
  components: {
    GazetteProse: gazetteProseFieldDef,
    GazettePullQuote: gazettePullQuoteFieldDef,
    GazetteCode: gazetteCodeFieldDef,
    GazetteImage: gazetteImageFieldDef,
    GazetteDivider: gazetteDividerFieldDef,
  },
}

export type BodyEditorConfig = typeof bodyEditorConfig
