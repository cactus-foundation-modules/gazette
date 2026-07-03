'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { GazetteTagWithCount } from '@/modules/gazette/lib/types'

export default function TagsScreen({ tags, isEditor }: { tags: GazetteTagWithCount[]; isEditor: boolean }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [editSlug, setEditSlug] = useState('')
  const [inUseError, setInUseError] = useState<{ id: string; count: number } | null>(null)

  async function createTag(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    await fetch('/api/m/gazette/admin/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    setName('')
    setBusy(false)
    router.refresh()
  }

  async function saveSlug(id: string) {
    await fetch(`/api/m/gazette/admin/tags/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: editSlug }),
    })
    setEditing(null)
    router.refresh()
  }

  async function deleteTag(id: string) {
    setInUseError(null)
    const res = await fetch(`/api/m/gazette/admin/tags/${id}`, { method: 'DELETE' })
    if (res.status === 409) {
      const data = await res.json()
      setInUseError({ id, count: data.count })
      return
    }
    router.refresh()
  }

  return (
    <div>
      {isEditor && (
        <form onSubmit={createTag} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New tag name"
            style={{ flex: 1, maxWidth: 320, padding: '0.375rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.875rem', fontFamily: 'inherit', background: 'var(--color-bg)', color: 'var(--color-text)' }}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !name.trim()}>Add tag</button>
        </form>
      )}

      {tags.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem' }}>
          No tags yet. You can create one above.
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Name</th><th>Slug</th><th>Posts</th>{isEditor && <th></th>}</tr>
            </thead>
            <tbody>
              {tags.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>
                    {editing === t.id ? (
                      <div>
                        <input
                          value={editSlug}
                          onChange={(e) => setEditSlug(e.target.value)}
                          style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.8125rem', fontFamily: 'inherit', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                        />
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginTop: '0.25rem' }}>
                          Changing this slug will break any existing links to this tag page
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={() => saveSlug(t.id)} style={{ marginTop: '0.25rem' }}>Save</button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{t.slug}</span>
                    )}
                  </td>
                  <td>{t.postCount}</td>
                  {isEditor && (
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                        {editing !== t.id && (
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(t.id); setEditSlug(t.slug) }}>Edit</button>
                        )}
                        <button className="btn btn-ghost btn-sm" onClick={() => deleteTag(t.id)}>Delete</button>
                      </div>
                      {inUseError?.id === t.id && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-destructive)', marginTop: '0.25rem' }}>
                          {inUseError.count} posts use this tag. Remove it from those posts first.
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
