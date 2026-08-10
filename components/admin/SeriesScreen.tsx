'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAdminPath } from '@/components/admin/AdminPathContext'
import type { GazetteSeries } from '@/modules/gazette/lib/types'

export default function SeriesScreen({ series, isEditor }: { series: Array<GazetteSeries & { postCount: number }>; isEditor: boolean }) {
  const router = useRouter()
  const adminPath = useAdminPath()
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)

  async function createSeries(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setBusy(true)
    await fetch('/api/m/gazette/admin/series', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim() }),
    })
    setTitle('')
    setBusy(false)
    router.refresh()
  }

  return (
    <div>
      {isEditor && (
        <form onSubmit={createSeries} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New series title"
            style={{ flex: 1, maxWidth: 320, padding: '0.375rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.875rem', fontFamily: 'inherit', background: 'var(--color-bg)', color: 'var(--color-text)' }}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !title.trim()}>Add series</button>
        </form>
      )}

      {series.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '3rem' }}>
          No series yet.
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Title</th><th>Slug</th><th>Posts</th></tr></thead>
            <tbody>
              {series.map((s) => (
                <tr key={s.id}>
                  <td><Link href={`/${adminPath}/m/gazette/series/${s.id}`}>{s.title}</Link></td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{s.slug}</td>
                  <td>{s.postCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
