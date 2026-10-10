'use client'

import { useEffect, useRef, useState } from 'react'
import ImportWizard from './ImportWizard'

// The Import button beside New Post on the posts list. Importing is something you do
// to your posts, not a setting, so it lives with them rather than on a sub-tab of
// the gazette's settings. Opens the same wizard in a modal; a finished import
// refreshes the list behind it (see ImportWizard's router.refresh).
export default function ImportPostsButton() {
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    dialogRef.current?.focus()
    // Stop the page scrolling about underneath a long preview table.
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <>
      <button type="button" className="btn btn-secondary" onClick={() => setOpen(true)}>
        Import
      </button>
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '4rem 1rem 1rem', overflowY: 'auto' }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="gazette-import-title"
            tabIndex={-1}
            className="card"
            style={{ width: '100%', maxWidth: 760, margin: 0, outline: 'none', boxShadow: 'var(--shadow-elevated)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
              <div>
                <h2 id="gazette-import-title" className="card-title" style={{ margin: 0 }}>Import posts</h2>
                <p style={{ margin: '0.25rem 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  Bring posts across from WordPress, Medium or Substack. You get a preview first, so nothing is
                  imported until you have had a look.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '1.25rem', lineHeight: 1, color: 'var(--color-text-muted)' }}
              >
                ×
              </button>
            </div>
            <ImportWizard />
          </div>
        </div>
      )}
    </>
  )
}
