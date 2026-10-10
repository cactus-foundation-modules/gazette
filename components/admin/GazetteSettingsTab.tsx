'use client'

import { useEffect, useState } from 'react'
import type { GazetteSettings } from '@/modules/gazette/lib/types'
import SettingsForm from './SettingsForm'

// Settings > General > Gazette. Importing posts used to be a second sub-tab here; it
// is the Import button beside New Post on the posts list now.
export function GazetteSettingsTab() {
  const [settings, setSettings] = useState<GazetteSettings | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/m/gazette/admin/settings')
      .then(async (res) => {
        if (res.status === 403) { setForbidden(true); return }
        if (!res.ok) throw new Error('load failed')
        setSettings(await res.json())
      })
      .catch(() => setSettings(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Loading…</p>
  if (forbidden) {
    return <div className="alert alert-danger">Only gazette editors can view or change gazette settings.</div>
  }
  if (!settings) return <div className="alert alert-danger">Could not load the gazette settings. Try reloading the page.</div>

  return <SettingsForm settings={settings} />
}
