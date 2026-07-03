'use client'

import { useEffect, useState } from 'react'
import type { GazetteSettings } from '@/modules/gazette/lib/types'
import SettingsForm from './SettingsForm'
import ImportWizard from './ImportWizard'

export function GazetteSettingsTab() {
  const [settings, setSettings] = useState<GazetteSettings | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/m/gazette/admin/settings').then(async (res) => {
      if (res.status === 403) { setForbidden(true); setLoading(false); return }
      setSettings(await res.json())
      setLoading(false)
    })
  }, [])

  if (loading) return null
  if (forbidden || !settings) {
    return <div className="alert alert-danger">Only gazette editors can view or change gazette settings.</div>
  }

  return (
    <div>
      <SettingsForm settings={settings} />

      <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)', maxWidth: 720 }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '0.9375rem' }}>Import</h3>
        <ImportWizard />
      </div>
    </div>
  )
}
