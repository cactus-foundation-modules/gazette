'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAdminPath } from '@/components/admin/AdminPathContext'
import type { GazetteAccess } from '@/modules/gazette/lib/types'

const TABS = [
  { label: 'Posts', segment: 'posts', editorOnly: false },
  { label: 'Tags', segment: 'tags', editorOnly: false },
  { label: 'Series', segment: 'series', editorOnly: false },
  { label: 'Authors', segment: 'authors', editorOnly: false },
  { label: 'Comments', segment: 'comments', editorOnly: true },
  { label: 'Templates', segment: 'templates', editorOnly: false },
]

export default function GazetteNav({ access }: { access: GazetteAccess }) {
  const pathname = usePathname()
  const adminPath = useAdminPath()
  const base = `/${adminPath}/m/gazette`

  const tabs = TABS.filter((t) => !t.editorOnly || access.isEditor)

  return (
    <div style={{ display: 'flex', gap: 0, alignItems: 'center', borderBottom: '1px solid var(--color-border)', marginBottom: '1.5rem', overflowX: 'auto' }}>
      {tabs.map((tab) => {
        const href = `${base}/${tab.segment}`
        const active = pathname?.startsWith(href)
        return (
          <Link
            key={tab.segment}
            href={href}
            prefetch={false}
            style={{
              padding: '0.625rem 1rem', textDecoration: 'none',
              borderBottom: active ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: active ? 600 : 400,
              fontSize: 'var(--text-base)', whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
