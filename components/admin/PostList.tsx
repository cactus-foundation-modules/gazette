'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAdminPath } from '@/components/admin/AdminPathContext'
import type { GazettePostListItem, GazetteTag } from '@/modules/gazette/lib/types'
import type { PostsTab } from '@/modules/gazette/lib/db'

type Row = GazettePostListItem & { tags: GazetteTag[]; authorName: string | null }

type Props = {
  posts: Row[]
  total: number
  page: number
  totalPages: number
  tab: PostsTab
  q: string
}

const TABS: Array<{ label: string; value: PostsTab }> = [
  { label: 'All', value: 'all' },
  { label: 'Drafts', value: 'drafts' },
  { label: 'Published', value: 'published' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Pinned', value: 'pinned' },
  { label: 'Private', value: 'private' },
]

function statusBadge(status: string) {
  const cls = status === 'PUBLISHED' ? 'badge-success' : status === 'SCHEDULED' ? 'badge-info' : 'badge-muted'
  const label = status === 'PUBLISHED' ? 'Published' : status === 'SCHEDULED' ? 'Scheduled' : 'Draft'
  return <span className={`badge ${cls}`}>{label}</span>
}

export default function PostList({ posts, total, page, totalPages, tab, q }: Props) {
  const router = useRouter()
  const adminPath = useAdminPath()
  const base = `/${adminPath}/m/gazette/posts`
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [rowBusy, setRowBusy] = useState<Record<string, boolean>>({})
  const [search, setSearch] = useState(q)

  function toggleAll() {
    setSelected(selected.size === posts.length ? new Set() : new Set(posts.map((p) => p.id)))
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function deleteSelected() {
    if (!selected.size) return
    if (!confirm(`Delete ${selected.size} posts? This cannot be undone.`)) return
    setBusy(true)
    await fetch('/api/m/gazette/admin/posts/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', ids: [...selected] }),
    })
    setSelected(new Set())
    setBusy(false)
    router.refresh()
  }

  async function rowDelete(id: string) {
    if (!confirm('Delete this post? This cannot be undone.')) return
    setRowBusy((prev) => ({ ...prev, [id]: true }))
    await fetch(`/api/m/gazette/admin/posts/${id}`, { method: 'DELETE' })
    setRowBusy((prev) => ({ ...prev, [id]: false }))
    router.refresh()
  }

  async function rowDuplicate(id: string) {
    setRowBusy((prev) => ({ ...prev, [id]: true }))
    const res = await fetch(`/api/m/gazette/admin/posts/${id}/duplicate`, { method: 'POST' })
    const data = await res.json()
    setRowBusy((prev) => ({ ...prev, [id]: false }))
    if (data?.id) router.push(`${base}/${data.id}`)
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams({ tab, ...(search ? { q: search } : {}) })
    router.push(`${base}?${params.toString()}`)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 0, alignItems: 'center', borderBottom: '1px solid var(--color-border)', marginBottom: '1rem', overflowX: 'auto' }}>
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`${base}?tab=${t.value}`}
            prefetch={false}
            style={{
              padding: '0.625rem 1rem', textDecoration: 'none',
              borderBottom: tab === t.value ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: tab === t.value ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: tab === t.value ? 600 : 400,
              fontSize: 'var(--text-base)', whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </Link>
        ))}
        <span style={{ marginLeft: 'auto', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{total} total</span>
      </div>

      <form onSubmit={submitSearch} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title…"
          style={{ flex: 1, maxWidth: 320, padding: '0.375rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.875rem', fontFamily: 'inherit', background: 'var(--color-bg)', color: 'var(--color-text)' }}
        />
        <button type="submit" className="btn btn-secondary btn-sm">Search</button>
      </form>

      {selected.size > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--color-surface-alt)', borderRadius: '0.375rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{selected.size} selected</span>
          <button className="btn btn-danger btn-sm" onClick={deleteSelected} disabled={busy}>Delete selected</button>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem' }}>
          Nothing in the gazette yet. Write your first post.
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: '2rem' }}>
                  <input type="checkbox" checked={selected.size === posts.length && posts.length > 0} onChange={toggleAll} style={{ width: '1.125rem', height: '1.125rem', cursor: 'pointer' }} />
                </th>
                <th>Title</th>
                <th>Status</th>
                <th>Author</th>
                <th>Published</th>
                <th>Tags</th>
                <th>Views</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id}>
                  <td onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} style={{ width: '1.125rem', height: '1.125rem', cursor: 'pointer' }} />
                  </td>
                  <td>
                    <Link href={`${base}/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {p.title}
                      {p.isPinned && <span title="Pinned" style={{ marginLeft: '0.375rem' }}>📌</span>}
                      {p.isPrivate && <span title="Private" style={{ marginLeft: '0.375rem' }}>🔒</span>}
                    </Link>
                  </td>
                  <td>{statusBadge(p.status)}</td>
                  <td style={{ fontSize: '0.8125rem' }}>{p.authorName ?? <span style={{ color: 'var(--color-text-muted)' }}>—</span>}</td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('en-GB') : p.scheduledFor ? new Date(p.scheduledFor).toLocaleDateString('en-GB') : '—'}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{p.tags.map((t) => t.name).join(', ') || '—'}</td>
                  <td style={{ fontSize: '0.8125rem' }}>{p.viewCount}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                      <Link href={`${base}/${p.id}`} className="btn btn-ghost btn-sm">Edit</Link>
                      <button type="button" className="btn btn-ghost btn-sm" disabled={rowBusy[p.id]} onClick={() => rowDuplicate(p.id)}>Duplicate</button>
                      <button type="button" className="btn btn-ghost btn-sm" disabled={rowBusy[p.id]} onClick={() => rowDelete(p.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'center' }}>
          {page > 1 && <Link href={`${base}?tab=${tab}&page=${page - 1}`} className="btn btn-secondary btn-sm">Previous</Link>}
          <span style={{ lineHeight: '2rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Page {page} of {totalPages}</span>
          {page < totalPages && <Link href={`${base}?tab=${tab}&page=${page + 1}`} className="btn btn-secondary btn-sm">Next</Link>}
        </div>
      )}
    </div>
  )
}
