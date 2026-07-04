'use client'

import { usePathname } from 'next/navigation'
import { useAdminPath } from '@/components/admin/AdminPathContext'
import { TabStrip } from '@/components/admin/TabStrip'
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
    <TabStrip
      style={{ marginBottom: '1.5rem' }}
      items={tabs.map((tab) => {
        const href = `${base}/${tab.segment}`
        return { key: tab.segment, label: tab.label, href, active: !!pathname?.startsWith(href) }
      })}
    />
  )
}
