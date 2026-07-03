'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminPath } from '@/components/admin/AdminPathContext'

export default function TemplateChooser({ templates }: { templates: Array<{ id: string; title: string }> }) {
  const router = useRouter()
  const adminPath = useAdminPath()
  const [busy, setBusy] = useState<string | null>(null)

  async function choose(templateId?: string) {
    setBusy(templateId ?? 'blank')
    const res = await fetch('/api/m/gazette/admin/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Untitled post', templateId }),
    })
    const data = await res.json()
    setBusy(null)
    if (data?.id) router.push(`/${adminPath}/m/gazette/posts/${data.id}`)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
      <button
        type="button"
        className="card"
        onClick={() => choose()}
        disabled={busy !== null}
        style={{ padding: '1.5rem', textAlign: 'left', cursor: 'pointer', border: '1px dashed var(--color-border)', background: 'var(--color-surface)' }}
      >
        <strong>Blank post</strong>
        <p style={{ margin: '0.375rem 0 0', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Start from scratch</p>
      </button>
      {templates.map((t) => (
        <button
          key={t.id}
          type="button"
          className="card"
          onClick={() => choose(t.id)}
          disabled={busy !== null}
          style={{ padding: '1.5rem', textAlign: 'left', cursor: 'pointer' }}
        >
          <strong>{t.title}</strong>
        </button>
      ))}
    </div>
  )
}
