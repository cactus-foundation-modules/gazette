'use client'

import { useState } from 'react'
import type { GazetteTag } from '@/modules/gazette/lib/types'

type Props = {
  allTags: GazetteTag[]
  selectedIds: string[]
  onChange: (ids: string[], newTags: GazetteTag[]) => void
}

export default function TagMultiSelect({ allTags, selectedIds, onChange }: Props) {
  const [tags, setTags] = useState(allTags)
  const [creating, setCreating] = useState(false)
  const [newTagName, setNewTagName] = useState('')

  function toggle(id: string) {
    const next = selectedIds.includes(id) ? selectedIds.filter((t) => t !== id) : [...selectedIds, id]
    onChange(next, tags)
  }

  async function createTag() {
    const name = newTagName.trim()
    if (!name) return
    setCreating(true)
    const res = await fetch('/api/m/gazette/admin/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const created = await res.json()
    setCreating(false)
    setNewTagName('')
    if (created?.id) {
      const newTag = { id: created.id, name, slug: name.toLowerCase().replace(/\s+/g, '-'), createdAt: new Date() }
      const nextTags = [...tags, newTag]
      setTags(nextTags)
      onChange([...selectedIds, created.id], nextTags)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.5rem' }}>
        {tags.map((t) => {
          const active = selectedIds.includes(t.id)
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              className={`badge ${active ? 'badge-primary' : 'badge-default'}`}
              style={{ cursor: 'pointer', border: 'none' }}
            >
              {t.name}
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: '0.375rem' }}>
        <input
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); createTag() } }}
          placeholder="New tag…"
          style={{ flex: 1, padding: '0.3rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.8125rem', fontFamily: 'inherit', background: 'var(--color-bg)', color: 'var(--color-text)' }}
        />
        <button type="button" className="btn btn-secondary btn-sm" onClick={createTag} disabled={creating || !newTagName.trim()}>Add</button>
      </div>
    </div>
  )
}
