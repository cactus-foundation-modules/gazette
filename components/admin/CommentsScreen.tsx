'use client'

import { Fragment, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAdminPath } from '@/components/admin/AdminPathContext'
import type { GazetteComment } from '@/modules/gazette/lib/types'

type Row = GazetteComment & { postTitle: string }

const TABS = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'All', value: 'all' },
]

export default function CommentsScreen({ comments, total, page, status }: { comments: Row[]; total: number; page: number; status: string }) {
  const router = useRouter()
  const adminPath = useAdminPath()
  const base = `/${adminPath}/m/gazette/comments`
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [replying, setReplying] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState('')

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function bulk(action: 'approve' | 'reject' | 'delete') {
    if (!selected.size) return
    await fetch('/api/m/gazette/admin/comments/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ids: [...selected] }),
    })
    setSelected(new Set())
    router.refresh()
  }

  async function rowAction(id: string, action: 'APPROVED' | 'REJECTED') {
    await fetch(`/api/m/gazette/admin/comments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: action }),
    })
    router.refresh()
  }

  async function rowDelete(id: string) {
    if (!confirm('Delete this comment?')) return
    await fetch(`/api/m/gazette/admin/comments/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  async function submitReply(id: string) {
    if (!replyBody.trim()) return
    await fetch(`/api/m/gazette/admin/comments/${id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: replyBody }),
    })
    setReplying(null)
    setReplyBody('')
    router.refresh()
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 0, alignItems: 'center', borderBottom: '1px solid var(--color-border)', marginBottom: '1rem' }}>
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`${base}?status=${t.value}`}
            prefetch={false}
            style={{
              padding: '0.625rem 1rem', textDecoration: 'none',
              borderBottom: status === t.value ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: status === t.value ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: status === t.value ? 600 : 400,
            }}
          >
            {t.label}
          </Link>
        ))}
        <span style={{ marginLeft: 'auto', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{total} total</span>
      </div>

      {selected.size > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => bulk('approve')}>Approve</button>
          <button className="btn btn-secondary btn-sm" onClick={() => bulk('reject')}>Reject</button>
          <button className="btn btn-danger btn-sm" onClick={() => bulk('delete')}>Delete</button>
        </div>
      )}

      {comments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem' }}>
          No comments yet.
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: '2rem' }}></th>
                <th>Post</th><th>Author</th><th>Comment</th><th>Status</th><th>Date</th><th></th>
              </tr>
            </thead>
            <tbody>
              {comments.map((c) => (
                <Fragment key={c.id}>
                  <tr>
                    <td><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} /></td>
                    <td style={{ fontSize: '0.8125rem' }}>{c.postTitle}</td>
                    <td style={{ fontSize: '0.8125rem' }}>{c.authorName}</td>
                    <td style={{ fontSize: '0.8125rem' }}>{c.body.slice(0, 120)}{c.body.length > 120 ? '…' : ''}</td>
                    <td><span className={`badge ${c.status === 'APPROVED' ? 'badge-success' : c.status === 'REJECTED' ? 'badge-danger' : 'badge-info'}`}>{c.status}</span></td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{new Date(c.createdAt).toLocaleDateString('en-GB')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                        {c.status !== 'APPROVED' && <button className="btn btn-ghost btn-sm" onClick={() => rowAction(c.id, 'APPROVED')}>Approve</button>}
                        {c.status !== 'REJECTED' && <button className="btn btn-ghost btn-sm" onClick={() => rowAction(c.id, 'REJECTED')}>Reject</button>}
                        <button className="btn btn-ghost btn-sm" onClick={() => setReplying(replying === c.id ? null : c.id)}>Reply</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => rowDelete(c.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                  {replying === c.id && (
                    <tr>
                      <td colSpan={7}>
                        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem 0' }}>
                          <textarea
                            value={replyBody}
                            onChange={(e) => setReplyBody(e.target.value)}
                            rows={2}
                            style={{ flex: 1, padding: '0.375rem', border: '1px solid var(--color-border)', borderRadius: 6, fontFamily: 'inherit', background: 'var(--color-bg)', color: 'var(--color-text)' }}
                          />
                          <button className="btn btn-primary btn-sm" onClick={() => submitReply(c.id)}>Send</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 25 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'center' }}>
          {page > 1 && <Link href={`${base}?status=${status}&page=${page - 1}`} className="btn btn-secondary btn-sm">Previous</Link>}
          <Link href={`${base}?status=${status}&page=${page + 1}`} className="btn btn-secondary btn-sm">Next</Link>
        </div>
      )}
    </div>
  )
}
