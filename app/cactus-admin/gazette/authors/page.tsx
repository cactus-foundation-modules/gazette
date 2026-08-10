import { getSessionFromCookie } from '@/lib/auth/session'
import { getGazetteAccess, canViewGazetteAdmin } from '@/modules/gazette/lib/permissions'
import { listAuthors } from '@/modules/gazette/lib/db'
import GazetteNav from '@/modules/gazette/components/admin/GazetteNav'
import Link from 'next/link'
import { headers } from 'next/headers'

export const metadata = { title: 'Gazette Authors — Admin' }

export default async function GazetteAuthorsPage() {
  const user = await getSessionFromCookie()
  if (!user) return null
  const access = await getGazetteAccess(user)
  if (!canViewGazetteAdmin(access)) {
    return <div className="alert alert-danger">You do not have permission to manage the gazette.</div>
  }

  const authors = await listAuthors()
  const adminPath = (await headers()).get('x-cactus-admin-path') ?? ''

  return (
    <div>
      <GazetteNav access={access} />
      <div className="page-header">
        <h1 className="page-title">Authors</h1>
      </div>
      {authors.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-secondary)', padding: '3rem' }}>
          No authors yet.
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Role</th><th>Posts</th><th></th></tr></thead>
            <tbody>
              {authors.map((a) => (
                <tr key={a.userId}>
                  <td>{a.displayName ?? a.username}</td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{a.role ?? '—'}</td>
                  <td>{a.postCount}</td>
                  <td>
                    {(access.isEditor || a.userId === user.id) && (
                      <Link href={`/${adminPath}/m/gazette/authors/${a.userId}`} className="btn btn-ghost btn-sm">Edit profile</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
