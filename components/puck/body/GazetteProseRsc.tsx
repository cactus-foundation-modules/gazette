import React from 'react'
import type { JSONContent } from '@tiptap/core'
import { renderProseHtml } from '@/modules/gazette/lib/prose'
import { getHeadingIdsForBlock } from '@/modules/gazette/lib/toc'
import type { TocHeading } from '@/modules/gazette/lib/toc'
import { sanitizeRichText } from '@/lib/sanitize'
import { GazetteProse, gazetteProseFieldDef, type GazetteProseProps } from './GazetteProse'

// Published render of a GazetteProse block. Lives apart from GazetteProse.tsx
// because that file is reachable from the client editor, and core's sanitiser
// lazy-requires jsdom - importing it there would drag jsdom into the browser
// bundle. Same split as core's RichText (config.core.tsx vs config.rsc.tsx).
// Contributors write this content, so it is cleaned with the same allow-list
// as core's RichText before it reaches dangerouslySetInnerHTML. The heading ids
// the TOC links to are plain `id` attributes, which that allow-list keeps.
export function makeGazetteProseRsc(headings: TocHeading[]) {
  return function GazetteProseRsc(props: GazetteProseProps) {
    const { content, id = '' } = props
    if (!content || React.isValidElement(content)) return <GazetteProse {...props} />
    const ids = getHeadingIdsForBlock(headings, id)
    const html = sanitizeRichText(renderProseHtml(content as JSONContent, ids))
    return <div className="gz-prose" dangerouslySetInnerHTML={{ __html: html }} />
  }
}

// RSC variant: the richtext field type triggers a client-only hook (useRichtextProps)
// even inside <Render>, so - mirroring core's own puckRscConfig treatment of
// RichTextBlock - the RSC field def swaps to a plain textarea. Fields are never
// shown for public rendering anyway; this only avoids that hook running server-side.
export function makeGazetteProseRscFieldDef(headings: TocHeading[]) {
  return {
    ...gazetteProseFieldDef,
    fields: { content: { type: 'textarea' as const, label: 'Content (TipTap JSON)' } },
    render: makeGazetteProseRsc(headings),
  }
}
