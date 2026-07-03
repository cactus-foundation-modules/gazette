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

export default function TableOfContents({ headings }: { headings: TocHeading[] }) {
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
        @media (min-width: 1100px) {
          .gz-toc-desktop { display: block !important; position: sticky; top: 5rem; float: right; width: 200px; margin-left: 2rem; margin-bottom: 1rem; }
          .gz-toc-mobile { display: none !important; }
        }
      `}</style>
    </>
  )
}
