'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TemplateList({ templates, isEditor }: { templates: Array<{ id: string; title: string }>; isEditor: boolean }) {
  const router = useRouter()
  const [editing, setEditing] = useState<string | null>(null)
  const [title, setTitle] = useState('')

  async function rename(id: string) {
    await fetch(`/api/m/gazette/admin/templates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    setEditing(null)
    router.refresh()
  }

  async function remove(id: string) {
    if (!confirm('Delete this template?')) return
    await fetch(`/api/m/gazette/admin/templates/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  if (templates.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem' }}>
        No templates yet. Save a post as a template from the post editor.
      </div>
    )
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead><tr><th>Title</th>{isEditor && <th></th>}</tr></thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.id}>
              <td>
                {editing === t.id ? (
                  <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ padding: '0.25rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)', color: 'var(--color-text)' }} />
                ) : t.title}
              </td>
              {isEditor && (
                <td>
                  <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                    {editing === t.id ? (
                      <button className="btn btn-secondary btn-sm" onClick={() => rename(t.id)}>Save</button>
                    ) : (
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(t.id); setTitle(t.title) }}>Rename</button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={() => remove(t.id)}>Delete</button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
