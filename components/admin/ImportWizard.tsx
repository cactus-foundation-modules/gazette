'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ImportPreviewRow } from '@/modules/gazette/lib/import/types'

type ImportType = 'wordpress' | 'medium' | 'substack'

const TYPE_LABELS: Record<ImportType, string> = {
  wordpress: 'WordPress XML',
  medium: 'Medium export',
  substack: 'Substack CSV',
}

export default function ImportWizard() {
  const router = useRouter()
  const [type, setType] = useState<ImportType>('wordpress')
  const [files, setFiles] = useState<FileList | null>(null)
  const [preview, setPreview] = useState<ImportPreviewRow[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [error, setError] = useState('')

  function buildFormData(dryRun: boolean): FormData {
    const fd = new FormData()
    fd.set('type', type)
    fd.set('dryRun', String(dryRun))
    if (files) for (const f of Array.from(files)) fd.append('files', f)
    return fd
  }

  async function runPreview() {
    setError('')
    setBusy(true)
    const res = await fetch('/api/m/gazette/admin/import', { method: 'POST', body: buildFormData(true) })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) { setError(data.error ?? 'Preview failed'); return }
    setPreview(data.preview ?? [])
  }

  async function runImport() {
    setBusy(true)
    const res = await fetch('/api/m/gazette/admin/import', { method: 'POST', body: buildFormData(false) })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) { setError(data.error ?? 'Import failed'); return }
    setSummary(data.summary)
    setPreview(null)
    router.refresh()
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {(Object.keys(TYPE_LABELS) as ImportType[]).map((t) => (
          <button
            key={t}
            className={`btn btn-sm ${type === t ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setType(t); setPreview(null); setSummary(null) }}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {type === 'medium' && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          Unzip your export and choose the HTML files inside the posts folder.
        </p>
      )}
      {type === 'substack' && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          Unzip your export and choose posts.csv, plus the matching HTML files if you have them.
        </p>
      )}

      <input
        type="file"
        multiple={type !== 'wordpress'}
        accept={type === 'wordpress' ? '.xml' : type === 'substack' ? '.csv,.html' : '.html'}
        onChange={(e) => setFiles(e.target.files)}
        style={{ marginBottom: '1rem' }}
      />

      {error && <p style={{ color: 'var(--color-destructive)', fontSize: '0.8125rem' }}>{error}</p>}
      {summary && <p style={{ color: 'var(--color-success)', fontSize: '0.875rem' }}>{summary}</p>}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={runPreview} disabled={busy || !files}>Preview import</button>
        {preview && preview.length > 0 && (
          <button className="btn btn-primary btn-sm" onClick={runImport} disabled={busy}>
            Import {preview.filter((p) => p.action === 'Import').length} posts
          </button>
        )}
      </div>

      {preview && (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Title</th><th>Slug</th><th>Tags</th><th>Author match</th><th>Action</th></tr></thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i}>
                  <td>{row.title}</td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{row.slug}</td>
                  <td style={{ fontSize: '0.8125rem' }}>{row.tags.join(', ') || '—'}</td>
                  <td style={{ fontSize: '0.8125rem' }}>{row.authorMatch}</td>
                  <td><span className={`badge ${row.action === 'Import' ? 'badge-success' : 'badge-muted'}`}>{row.action}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
