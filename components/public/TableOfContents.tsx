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

// desktopBreakpoint is the site's tablet breakpoint (Styles > Spacing &
// Breakpoints), resolved server-side and passed in so the sticky-sidebar vs
// collapsed-<details> switch tracks the setting instead of a hardcoded width.
export default function TableOfContents({ headings, desktopBreakpoint }: { headings: TocHeading[]; desktopBreakpoint: string }) {
  if (headings.length < 2) return null

  return (
    <>
      <aside className="gz-toc-desktop" style={{ display: 'none' }}>
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
          .gz-toc-desktop { display: block !important; position: sticky; top: 5rem; float: right; width: 200px; margin-left: 2rem; margin-bottom: 1rem; }
          .gz-toc-mobile { display: none !important; }
        }
      `}</style>
    </>
  )
}
