'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAdminPath } from '@/components/admin/AdminPathContext'
import type { GazetteSeries, GazettePostListItem } from '@/modules/gazette/lib/types'

export default function SeriesReorder({ series, posts, isEditor }: {
  series: GazetteSeries
  posts: GazettePostListItem[]
  isEditor: boolean
}) {
  const router = useRouter()
  const adminPath = useAdminPath()
  const [title, setTitle] = useState(series.title)
  const [description, setDescription] = useState(series.description ?? '')
  const [order, setOrder] = useState(posts)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  async function saveDetails() {
    await fetch(`/api/m/gazette/admin/series/${series.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    })
    router.refresh()
  }

  async function deleteSeries() {
    if (!confirm('Delete this series? Posts are kept, just detached from the series.')) return
    await fetch(`/api/m/gazette/admin/series/${series.id}`, { method: 'DELETE' })
    router.push(`/${adminPath}/m/gazette/series`)
  }

  function onDrop(index: number) {
    if (dragIndex === null || dragIndex === index) return
    const next = [...order]
    const [moved] = next.splice(dragIndex, 1)
    if (!moved) return
    next.splice(index, 0, moved)
    setOrder(next)
    setDragIndex(null)
    fetch(`/api/m/gazette/admin/series/${series.id}/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postIds: next.map((p) => p.id) }),
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 600 }}>
      <div className="card" style={{ padding: '1rem' }}>
        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!isEditor}
          style={{ width: '100%', padding: '0.375rem', border: '1px solid var(--color-border)', borderRadius: 6, marginBottom: '0.75rem', background: 'var(--color-bg)', color: 'var(--color-text)' }}
        />
        <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!isEditor}
          rows={3}
          style={{ width: '100%', padding: '0.375rem', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)', color: 'var(--color-text)', resize: 'vertical' }}
        />
        {isEditor && (
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button className="btn btn-primary btn-sm" onClick={saveDetails}>Save</button>
            <button className="btn btn-danger btn-sm" onClick={deleteSeries}>Delete series</button>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: '1rem' }}>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem' }}>Posts in this series</h3>
        {order.length === 0 && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No posts yet.</p>}
        {order.map((p, i) => (
          <div
            key={p.id}
            draggable={isEditor}
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem',
              border: '1px solid var(--color-border)', borderRadius: 6, marginBottom: '0.375rem',
              background: 'var(--color-bg)', cursor: isEditor ? 'grab' : 'default',
            }}
          >
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', width: '1.5rem' }}>{i + 1}</span>
            <Link href={`/${adminPath}/m/gazette/posts/${p.id}`} style={{ flex: 1 }}>{p.title}</Link>
          </div>
        ))}
      </div>
    </div>
  )
}
