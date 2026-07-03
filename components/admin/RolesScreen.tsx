'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { RoleListItem } from '@/modules/gazette/lib/db'
import type { GazetteRole } from '@/modules/gazette/lib/types'

type UserPickerItem = { id: string; email: string; username: string; displayName: string | null }

const ROLES: GazetteRole[] = ['GAZETTE_CONTRIBUTOR', 'GAZETTE_AUTHOR', 'GAZETTE_EDITOR']
const ROLE_LABELS: Record<GazetteRole, string> = {
  GAZETTE_CONTRIBUTOR: 'Contributor',
  GAZETTE_AUTHOR: 'Author',
  GAZETTE_EDITOR: 'Editor',
}

export default function RolesScreen({ roles }: { roles: RoleListItem[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserPickerItem[]>([])
  const [searching, setSearching] = useState(false)

  async function search(q: string) {
    setQuery(q)
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    const res = await fetch(`/api/m/gazette/admin/users?q=${encodeURIComponent(q)}`)
    const data = await res.json()
    setResults(data.users ?? [])
    setSearching(false)
  }

  async function assign(userId: string, role: GazetteRole) {
    await fetch(`/api/m/gazette/admin/roles/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    setQuery('')
    setResults([])
    router.refresh()
  }

  async function remove(userId: string) {
    await fetch(`/api/m/gazette/admin/roles/${userId}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <div>
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem' }}>Assign a role</h3>
        <input
          value={query}
          onChange={(e) => search(e.target.value)}
          placeholder="Search by name or email…"
          style={{ width: '100%', maxWidth: 320, padding: '0.375rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.875rem', fontFamily: 'inherit', background: 'var(--color-bg)', color: 'var(--color-text)' }}
        />
        {searching && <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Searching…</p>}
        {results.map((u) => (
          <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ flex: 1, fontSize: '0.875rem' }}>{u.displayName ?? u.username} ({u.email})</span>
            {ROLES.map((r) => (
              <button key={r} className="btn btn-secondary btn-sm" onClick={() => assign(u.id, r)}>{ROLE_LABELS[r]}</button>
            ))}
          </div>
        ))}
      </div>

      {roles.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem' }}>
          No gazette roles assigned yet.
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>User</th><th>Email</th><th>Role</th><th></th></tr></thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.userId}>
                  <td>{r.displayName ?? r.username}</td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{r.email}</td>
                  <td>
                    <select
                      defaultValue={r.role ?? ''}
                      onChange={(e) => assign(r.userId, e.target.value as GazetteRole)}
                      style={{ padding: '0.25rem', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)', color: 'var(--color-text)' }}
                    >
                      {ROLES.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
                    </select>
                  </td>
                  <td><button className="btn btn-ghost btn-sm" onClick={() => remove(r.userId)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
