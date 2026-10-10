'use client'

import { useEffect, useState } from 'react'
import type { GazetteSettings } from '@/modules/gazette/lib/types'
import SettingsForm from './SettingsForm'
import ImportWizard from './ImportWizard'
import { TabStrip } from '@/components/admin/TabStrip'

export function GazetteSettingsTab() {
  const [settings, setSettings] = useState<GazetteSettings | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sub, setSub] = useState<'settings' | 'import'>('settings')

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
      <TabStrip
        items={[
          { key: 'settings', label: 'Settings', active: sub === 'settings', onClick: () => setSub('settings') },
          { key: 'import', label: 'Import', active: sub === 'import', onClick: () => setSub('import') },
        ]}
      />
      <div hidden={sub !== 'settings'}>
        <SettingsForm settings={settings} showSave={sub === 'settings'} />
      </div>
      {sub === 'import' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.9375rem' }}>Import</h3>
          <ImportWizard />
        </div>
      )}
    </div>
  )
}
