'use client'

import type { TocHeading } from '@/modules/gazette/lib/toc'

function TocLinks({ headings }: { headings: TocHeading[] }) {
  return (
    <nav className="gz-toc" aria-label="Table of contents">
      {headings.map((h) => (
        <a key={h.id} href={`#${h.id}`} style={{ paddingLeft: h.level === 3 ? '1rem' : 0 }}>{h.text}</a>
      ))}
    </nav>
  )
}

// `float` is the built-in post page's arrangement: the contents list floats out
// to the right of the article text and the prose wraps around it.
// `flow` is for the Table of Contents Puck block, which is dropped into a
// column of its own - a float there would pull the list out of the column and
// leave whatever came next (typically the Series Navigation block) wrapping
// its text around it one character at a time.
export type TocVariant = 'float' | 'flow'

// desktopBreakpoint is the site's tablet breakpoint (Styles > Spacing &
// Breakpoints), resolved server-side and passed in so the sticky-sidebar vs
// collapsed-<details> switch tracks the setting instead of a hardcoded width.
export default function TableOfContents({
  headings,
  desktopBreakpoint,
  variant = 'float',
}: {
  headings: TocHeading[]
  desktopBreakpoint: string
  variant?: TocVariant
}) {
  if (headings.length < 2) return null

  return (
    <>
      <aside className="gz-toc-desktop" data-toc-variant={variant} style={{ display: 'none' }}>
        {variant === 'flow' && (
          <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: '0 0 0.5rem' }}>Contents</p>
        )}
        <TocLinks headings={headings} />
      </aside>
      <details className="gz-toc-mobile" style={{ margin: '1.5rem 0', border: '1px solid var(--color-border)', borderRadius: 8, padding: '0.75rem 1rem' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Contents</summary>
        <div style={{ marginTop: '0.5rem' }}>
          <TocLinks headings={headings} />
        </div>
      </details>
      <style>{`
        @media (min-width: calc(${desktopBreakpoint} + 1px)) {
          .gz-toc-desktop { display: block !important; position: sticky; top: 5rem; }
          .gz-toc-desktop[data-toc-variant="float"] { float: right; width: 200px; margin-left: 2rem; margin-bottom: 1rem; }
          .gz-toc-desktop[data-toc-variant="flow"] { position: static; margin-bottom: 1.5rem; }
          .gz-toc-mobile { display: none !important; }
        }
      `}</style>
    </>
  )
}
