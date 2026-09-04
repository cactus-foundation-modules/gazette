import { makeGazetteProseRscFieldDef } from './GazetteProse'
import { gazettePullQuoteFieldDef } from './GazettePullQuote'
import { gazetteCodeFieldDef } from './GazetteCode'
import { GazetteCodeRsc } from './GazetteCodeRsc'
import { gazetteImageRscFieldDef } from './GazetteImage'
import { gazetteDividerFieldDef } from './GazetteDivider'
import type { TocHeading } from '@/modules/gazette/lib/toc'

// Built per-post (not a static export) because GazetteProse's RSC render needs
// the whole document's heading-id map (see lib/toc.ts) to inject matching ids
// into each block's own headings.
export function makeBodyRscConfig(headings: TocHeading[]) {
  return {
    categories: {
      postContent: {
        title: 'Post content',
        components: ['GazetteProse', 'GazettePullQuote', 'GazetteCode', 'GazetteImage', 'GazetteDivider'],
        defaultExpanded: true,
      },
    },
    components: {
      GazetteProse: makeGazetteProseRscFieldDef(headings),
      GazettePullQuote: gazettePullQuoteFieldDef,
      GazetteCode: { ...gazetteCodeFieldDef, render: GazetteCodeRsc },
      GazetteImage: gazetteImageRscFieldDef,
      GazetteDivider: gazetteDividerFieldDef,
    },
     
  } as any
}
