'use client'

import { useState } from 'react'
import type { GazetteSettings } from '@/modules/gazette/lib/types'

export default function SettingsForm({ settings: initial }: { settings: GazetteSettings }) {
  const [settings, setSettings] = useState(initial)
  const [newEmoji, setNewEmoji] = useState('')
  const [saved, setSaved] = useState(false)

  function set<K extends keyof GazetteSettings>(key: K, value: GazetteSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  async function save() {
    await fetch('/api/m/gazette/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const reactionSet = settings.reactionSet ?? []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 560 }}>
      <div className="card" style={{ padding: '1rem' }}>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem' }}>General</h3>
        <label style={{ fontSize: '0.8125rem', display: 'block', marginBottom: '0.25rem' }}>Posts per page</label>
        <input
          type="number"
          value={settings.postsPerPage}
          onChange={(e) => set('postsPerPage', Number(e.target.value))}
          style={{ width: 100, padding: '0.375rem', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)', color: 'var(--color-text)', marginBottom: '0.75rem' }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
          <input type="checkbox" checked={settings.showViewCounts} onChange={(e) => set('showViewCounts', e.target.checked)} />
          Show view counts publicly
        </label>
        <label style={{ fontSize: '0.8125rem', display: 'block', marginBottom: '0.25rem' }}>Post links</label>
        <select
          value={settings.postUrlStyle}
          onChange={(e) => set('postUrlStyle', e.target.value as GazetteSettings['postUrlStyle'])}
          style={{ padding: '0.375rem', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)', color: 'var(--color-text)' }}
        >
          <option value="PREFIXED">Under the gazette (/gazette/your-post)</option>
          <option value="ROOT">Straight off the home page (/your-post)</option>
        </select>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', margin: '0.375rem 0 0' }}>
          Change this and old post links keep working - they send readers to the new address on their own.
          The listing, tags, series and archive pages stay under /gazette either way.
        </p>
      </div>

      <div className="card" style={{ padding: '1rem' }}>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem' }}>RSS</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
          <input type="checkbox" checked={settings.rssEnabled} onChange={(e) => set('rssEnabled', e.target.checked)} />
          Enable RSS feed
        </label>
        <label style={{ fontSize: '0.8125rem', display: 'block', marginBottom: '0.25rem' }}>Feed title</label>
        <input
          value={settings.feedTitle ?? ''}
          onChange={(e) => set('feedTitle', e.target.value || null)}
          style={{ width: '100%', padding: '0.375rem', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)', color: 'var(--color-text)', marginBottom: '0.75rem' }}
        />
        <label style={{ fontSize: '0.8125rem', display: 'block', marginBottom: '0.25rem' }}>Feed description</label>
        <textarea
          value={settings.feedDescription ?? ''}
          onChange={(e) => set('feedDescription', e.target.value || null)}
          rows={2}
          style={{ width: '100%', padding: '0.375rem', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)', color: 'var(--color-text)', resize: 'vertical' }}
        />
      </div>

      <div className="card" style={{ padding: '1rem' }}>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem' }}>Comments</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
          <input type="checkbox" checked={settings.commentsEnabled} onChange={(e) => set('commentsEnabled', e.target.checked)} />
          Enable comments
        </label>
        <label style={{ fontSize: '0.8125rem', display: 'block', marginBottom: '0.25rem' }}>Visibility</label>
        <select
          value={settings.commentsVisibility}
          onChange={(e) => set('commentsVisibility', e.target.value as GazetteSettings['commentsVisibility'])}
          style={{ padding: '0.375rem', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)', color: 'var(--color-text)', marginBottom: '0.75rem' }}
        >
          <option value="PUBLIC">Public</option>
          <option value="MEMBERS_ONLY">Members only</option>
        </select>
        <label style={{ fontSize: '0.8125rem', display: 'block', marginBottom: '0.25rem' }}>Moderation</label>
        <select
          value={settings.commentModeration}
          onChange={(e) => set('commentModeration', e.target.value as GazetteSettings['commentModeration'])}
          style={{ padding: '0.375rem', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)', color: 'var(--color-text)', marginBottom: '0.75rem' }}
        >
          <option value="PRE">Before publishing</option>
          <option value="POST">After publishing</option>
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
          <input type="checkbox" checked={settings.commentsThreaded} onChange={(e) => set('commentsThreaded', e.target.checked)} />
          Threaded replies
        </label>
      </div>

      <div className="card" style={{ padding: '1rem' }}>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem' }}>Reactions</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
          <input type="checkbox" checked={settings.reactionsEnabled} onChange={(e) => set('reactionsEnabled', e.target.checked)} />
          Enable reactions
        </label>
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          {reactionSet.map((emoji, i) => (
            <span key={i} className="badge badge-default" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {emoji}
              <button type="button" onClick={() => set('reactionSet', reactionSet.filter((_, j) => j !== i))} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.75rem' }}>×</button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <input
            value={newEmoji}
            onChange={(e) => setNewEmoji(e.target.value)}
            placeholder="Add emoji…"
            style={{ width: 100, padding: '0.25rem 0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)', color: 'var(--color-text)' }}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => { if (newEmoji.trim()) { set('reactionSet', [...reactionSet, newEmoji.trim()]); setNewEmoji('') } }}
          >
            Add
          </button>
        </div>
      </div>

      <button className="btn btn-primary" onClick={save}>{saved ? 'Saved' : 'Save settings'}</button>
    </div>
  )
}
