import React from 'react'
import { renderProseHtml } from '@/modules/gazette/lib/prose'

export type GazetteProseProps = { content?: unknown; id?: string }

// Shared render for editor canvas + RSC. The editor's richtext field transforms
// stored content into a React element for the canvas; the RSC path receives raw
// TipTap JSON and converts it to HTML with heading ids injected for the TOC.
export function GazetteProse(props: GazetteProseProps) {
  const { content } = props
  if (!content) {
    return <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Write here…</div>
  }
  if (React.isValidElement(content)) {
    return <div className="gz-prose">{content}</div>
  }
   
  const html = renderProseHtml(content as any)
  return <div className="gz-prose" dangerouslySetInnerHTML={{ __html: html }} />
}

export const gazetteProseFieldDef = {
  label: 'Prose',
  fields: {
    content: {
      type: 'richtext' as const,
      label: 'Content',
      options: {
        heading: { levels: [2, 3, 4] },
        code: false,
        codeBlock: false,
        strike: false,
        underline: false,
        horizontalRule: false,
        textAlign: false,
      },
    },
  },
  defaultProps: { content: undefined },
  render: GazetteProse,
}

// The RSC variants live in GazetteProseRsc.tsx (server-only, sanitised).
